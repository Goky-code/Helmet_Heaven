import mongoose from "mongoose";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
 
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 99;
const TAX_RATE = 0.08;
 
// Simple human-readable order id (schema marks orderId unique).
// Swap for nanoid/uuid if you already use one elsewhere.
const generateOrderId = () => {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD${stamp}${rand}`;
};
 
/**
 * Everything the payment.ejs page needs to render: the selected address,
 * validated cart items, and computed totals. Mirrors getCheckoutData but
 * also resolves which address is "selected" for step 1 of the page.
 */
export const getPaymentPageData = async (userId, addressId) => {
  const [cart, addresses] = await Promise.all([
    Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: [
          { path: "category", match: { isListed: true, isDeleted: false } },
          { path: "brand", match: { isListed: true, isDeleted: false } },
        ],
      })
      .lean(),
    Address.find({ userId }).lean(), // matches getCheckoutData's query exactly
  ]);
 
  const rawItems = cart?.items || [];
  let subtotal = 0;
  const validItems = [];
 
  for (const item of rawItems) {
    const product = item.productId;
    if (!product || product.isDeleted || product.isBlocked) continue;
    if (!product.category || !product.brand) continue;
 
    const variant = product.variants.find((v) => v.size === item.size);
    if (!variant || variant.stock <= 0) continue;
 
    subtotal += variant.price * item.quantity;
    validItems.push({ ...item, productId: product });
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
    cart: { ...(cart || { items: [] }), items: validItems },
    addresses,
    shippingAddress,
    addressId: shippingAddress?._id || null,
    coupon: null, // TODO: wire up your coupon/session logic here if you have one
    subtotal,
    shipping,
    tax,
    total,
  };
};
 
/**
 * Places a Cash on Delivery order. Razorpay / Wallet are valid enum values
 * on the schema but aren't gateway-integrated yet, so only COD actually
 * completes here — everything else is rejected with a clear message.
 */
export const placeOrder = async (userId, addressId, paymentMethod) => {
  if (paymentMethod !== "COD") {
    const err = new Error("Only Cash on Delivery is currently supported.");
    err.statusCode = 400;
    throw err;
  }
 
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const address = await Address.findOne({
      _id: addressId,
      userId,
    }).session(session);
    if (!address) throw new Error("Invalid address");
 
    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .session(session);
    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");
 
    let subTotal = 0;
    const orderItems = [];
    const orderedItems = []; // keep track of which cart items actually made it into the order (for stock decrement below)
 
    for (const item of cart.items) {
      const product = item.productId; // was `items.productId` (undefined) — fixed
 
      // Skip unavailable items instead of failing the whole order —
      // these were already excluded from what the user saw on the
      // payment page summary, so they shouldn't block checkout here.
      if (!product || product.isDeleted || product.isBlocked) continue;
 
      const variant = product.variants.find((v) => v.size === item.size);
      if (!variant || variant.stock <= 0 || variant.stock < item.quantity) continue;
 
      const totalPrice = variant.price * item.quantity;
      subTotal += totalPrice;
      orderedItems.push(item);
 
      // Matches orderItemschema's real fields — the earlier draft pushed
      // `price` / `total`, which don't exist on the schema and were
      // silently stripped out by Mongoose before saving.
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
 
    const shipping = subTotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const tax = Math.round(subTotal * TAX_RATE);
    const discount = 0; // TODO: apply couponCode here once you have coupon logic
    const grandTotal = subTotal + shipping + tax - discount;
 
    const [order] = await Order.create(
      [
        {
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
          paymentStatus: "Pending", // enum is Pending/Paid/Failed — "Unpaid" isn't valid
          orderStatus: "Pending",
          subTotal,
          shipping,
          tax,
          discount,
          grandTotal,
        },
      ],
      { session }
    );
 
    for (const item of orderedItems) {
      await Product.updateOne(
        { _id: item.productId._id, "variants.size": item.size },
        { $inc: { "variants.$.stock": -item.quantity } },
        { session }
      );
    }
 
    cart.items = [];
    await cart.save({ session });
 
    await session.commitTransaction();
 
    return {
      success: true,
      orderId: order.orderId,
      redirectUrl: `/user/order-success?orderId=${order.orderId}`,
      message: "Order placed successfully",
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
 
/**
 * Loads a placed order and reshapes it into the exact structure
 * order-success.ejs expects (orderNumber, items[].price/color,
 * deliveryAddress, subtotal, couponDiscount, total, etc). Your real Order
 * schema stores different field names (grandTotal, subTotal, address,
 * discount, salePrice...) so this is a pure presentation-layer mapping —
 * it doesn't change how orders are stored.
 */
export const getOrderSuccessData = async (userId, orderId) => {
  // orderId here is the human-readable Order.orderId (e.g. "ORD..."),
  // matching what placeOrder() redirects to. Falls back to _id lookup
  // in case you ever link using the Mongo _id instead.
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
      color: item.variantName, // no separate "color" field on your schema — variantName fills this slot
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
 
 