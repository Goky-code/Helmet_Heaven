import mongoose from "mongoose";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Wallet from "../../models/walletModel.js";
import WalletTransaction from "../../models/walletTransaction.js";
import crypto from "crypto";
 
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 99;
const TAX_RATE = 0.08;
 

const generateOrderId = () => {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD${stamp}${rand}`;
};
 

export const getPaymentPageData = async (userId, addressId,buyNowItem=null) => {

  const addresses=await Address.find({userId}).lean()
  let validItems=[]

  if (buyNowItem) {
    const product = await Product.findOne({ _id: buyNowItem.productId })
      .populate([
        { path: "category", match: { isListed: true, isDeleted: false } },
        { path: "brand", match: { isListed: true, isDeleted: false } },
      ])
      .lean();

  if (product && !product.isDeleted && !product.isBlocked && product.category && product.brand) {
      const variant = product.variants.find((v) => v.size === buyNowItem.size);
      if (variant && variant.stock > 0) {
        const quantity = Math.min(Number(buyNowItem.quantity) || 1, variant.stock, 5);
        validItems = [{ productId: product, size: buyNowItem.size, quantity }];
      }
    }
  } else {
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: [
          { path: "category", match: { isListed: true, isDeleted: false } },
          { path: "brand", match: { isListed: true, isDeleted: false } },
        ],
      })
      .lean();

    for (const item of (cart?.items || [])) {
      const product = item.productId;
      if (!product || product.isDeleted || product.isBlocked) continue;
      if (!product.category || !product.brand) continue;

      const variant = product.variants.find((v) => v.size === item.size);
      if (!variant || variant.stock <= 0) continue;

      validItems.push({ ...item, productId: product });
    }
  }

  let subtotal = 0;
  for (const item of validItems) {
    const variant = item.productId.variants.find((v) => v.size === item.size);
    if (variant) subtotal += variant.price * item.quantity;
  }

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  const shippingAddress =
    addresses.find((a) => String(a._id) === String(addressId)) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0] ||
    null;

  return {
    cart: { items: validItems },
    addresses,
    shippingAddress,
    addressId: shippingAddress?._id || null,
    coupon: null,
    subtotal,
    shipping,
    tax,
    total,
  };
};

 
export const placeOrder = async (userId, addressId, paymentMethod,buyNowItem=null) => {
  
 
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
     const address = await Address.findOne({ _id: addressId, userId }).session(session);
    if (!address) throw new Error("Invalid address");

    let subTotal = 0;
    const orderItems = [];
    const orderedItems = [];
    let cart = null;

    if (buyNowItem) {
      const product = await Product.findById(buyNowItem.productId).session(session);
      if (!product || product.isDeleted || product.isBlocked) {
        throw new Error("This product is no longer available.");
      }

      const variant = product.variants.find((v) => v.size === buyNowItem.size);
      if (!variant || variant.stock <= 0 || variant.stock < buyNowItem.quantity) {
        throw new Error(`${product.productName} has only ${variant?.stock ?? 0} stock left`);
      }

      const totalPrice = variant.price * buyNowItem.quantity;
      subTotal += totalPrice;

      orderItems.push({
        productId: product._id,
        productName: product.productName,
        size: buyNowItem.size,
        variantName: variant.variantName || variant.size,
        productImage: product.productImage?.[0] || "",
        quantity: buyNowItem.quantity,
        regularPrice: variant.regularPrice ?? variant.price,
        salePrice: variant.price,
        totalPrice,
        status: "Pending",
      });

      orderedItems.push({ productId: product, size: buyNowItem.size, quantity: buyNowItem.quantity });
    } else {
      cart = await Cart.findOne({ userId }).populate("items.productId").session(session);
      if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

      for (const item of cart.items) {
        const product = item.productId;
        if (!product || product.isDeleted || product.isBlocked) continue;

        const variant = product.variants.find((v) => v.size === item.size);
        if (!variant || variant.stock <= 0 || variant.stock < item.quantity) continue;

        const totalPrice = variant.price * item.quantity;
        subTotal += totalPrice;
        orderedItems.push(item);

        orderItems.push({
          productId: product._id,
          productName: product.productName,
          size: item.size,
          variantName: variant.variantName || variant.size,
          productImage: product.productImage?.[0] || "",
          quantity: item.quantity,
          regularPrice: variant.regularPrice ?? variant.price,
          salePrice: variant.price,
          totalPrice,
          status: "Pending",
        });
      }

      if (orderItems.length === 0) {
        throw new Error("None of the items in your cart are currently available.");
      }
    }

    const shipping = subTotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const tax = Math.round(subTotal * TAX_RATE);
    const discount = 0;
    const grandTotal = subTotal + shipping + tax - discount;

    let wallet=null

    if(paymentMethod==="Wallet"){
      wallet=await Wallet.findOne({userId}).session(session)

      if(!wallet){
        throw new Error("Wallet not found")
      }
      if(wallet.balance<grandTotal){
        throw new Error( `Insufficient wallet balance. Available balance: ₹${wallet.balance}`)      
      }
    }

    const [order] = await Order.create(
      [{
        orderId: generateOrderId(),
        userId,
        items: orderItems,
        address: {
          name: address.name,
          houseName: address.apartment,
          street: address.street,
          city: address.city,
          state: address.state,
          phone: address.phone,
          pincode: address.zip,
        },
        paymentMethod,
        paymentStatus: paymentMethod === "Wallet" ? "Paid" : "Pending",
        orderStatus: "Pending",
        subTotal,
        shipping,
        tax,
        discount,
        grandTotal,
      }],
      { session }
    )
       let debitedAmount=0
       let availableBalance=0
    if(paymentMethod==="Wallet"){
      debitedAmount=grandTotal
      wallet.balance-=debitedAmount

      await wallet.save({session})
      availableBalance=wallet.balance

      await WalletTransaction.create([{
        walletId:wallet._id,
        userId,
        transactionId: `TXN_${crypto.randomUUID()}`,
        type:"DEBIT",
        amount:grandTotal,
        description:"Order Payment",
        subDescription: `Payment for order ${order.orderId}`,
        status:"COMPLETED",
        referenceId:order.orderId,
      }],{session})
    }

    for (const item of orderedItems) {
      await Product.updateOne(
        { _id: item.productId._id, "variants.size": item.size },
        { $inc: { "variants.$.stock": -item.quantity } },
        { session }
      );
    }


    if (!buyNowItem && cart) {
      cart.items = [];
      await cart.save({ session })
    }

    await session.commitTransaction();

    return {
      success: true,
      orderId: order.orderId,
      redirectUrl: `/user/order-success?orderId=${order.orderId}`,
      message: "Order placed successfully",
      paymentMethod,
      debitedAmount,
      availableBalance
    }
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
 

export const getOrderSuccessData = async (userId, orderId) => {
 
  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { $or: [{ orderId }, { _id: orderId }], userId }
    : { orderId, userId };
 
  const order = await Order.findOne(query).lean();
  if (!order) return null;
 
  return {
    _id: order._id,
    orderNumber: order.orderId,
 
    items: order.items.map((item) => ({
      productName: item.productName,
      size: item.size,
      color: item.variantName, 
      price: item.salePrice,
      productId: {
        productName: item.productName,
        productImage: item.productImage ? [item.productImage] : [],
      },
    })),
 
    deliveryAddress: {
      street: order.address?.street,
      apartment: order.address?.houseName,
      city: order.address?.city,
      zip: order.address?.pincode,
      state: order.address?.state,
    },
 
    subtotal: order.subTotal,
    shipping: order.shipping,
    tax: order.tax,
    couponDiscount: order.discount,
    total: order.grandTotal,
  };
};
 
 