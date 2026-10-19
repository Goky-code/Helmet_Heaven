import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js"
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Coupon from "../../models/couponModel.js"
import mongoose from "mongoose";
import { calculateProductOffer } from "../../services/admin/offerService.js";

export const forOfferCalc = (product) => ({
  ...product,
  category: product.category?._id ?? product.category,
  brand: product.brand?._id ?? product.brand,
});


export const getUnitPricing = async (product, variant) => {
  const regularPrice = Number(variant.price);
  const offerPricing = await calculateProductOffer(product, regularPrice);

  const hasOffer = Boolean(
    offerPricing?.offer && Number(offerPricing.discountAmount) > 0
  );

  return {
    regularPrice,
    hasOffer,
    offerPricing: hasOffer ? offerPricing : null,
    unitPrice: hasOffer ? Number(offerPricing.salePrice) : regularPrice,
  };
};

export const getCheckoutData = async (userId, buyNowItem = null) => {
  try {
    const addresses = await Address.find({ userId }).lean();
    const selectedAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

    let items = [];

    if (buyNowItem) {
      const product = await Product.findById(buyNowItem.productId)
        .populate([
          { path: "category", match: { isListed: true, isDeleted: false } },
          { path: "brand", match: { isListed: true, isDeleted: false } },
        ])
        .lean();

      if (product && !product.isDeleted && !product.isBlocked && product.category && product.brand) {
        const variant = product.variants.find(
          v => v.size === buyNowItem.size && v.status === "ACTIVE"
        );

        if (variant && variant.stock > 0) {
          const quantity = Math.min(Number(buyNowItem.quantity) || 1, variant.stock, 5);
          const pricing = await getUnitPricing(forOfferCalc(product), variant);

          items = [{
            productId: product,
            size: buyNowItem.size,
            quantity,
            originalPrice: pricing.regularPrice,
            unitPrice: pricing.unitPrice,
            offerPricing: pricing.offerPricing,
          }];
        }
      }
    } else {
      const cart = await Cart.findOne({ userId })
        .populate("items.productId")
        .lean();

      for (const item of (cart?.items || [])) {
        const product = item.productId;
        if (!product || product.isDeleted || product.isBlocked) continue;

        const variant = product.variants.find(
          v => v.size === item.size && v.status === "ACTIVE"
        );
        if (!variant || variant.stock <= 0) continue;

        const pricing = await getUnitPricing(product, variant);

        items.push({
          ...item,
          productId: product,
          originalPrice: pricing.regularPrice,
          unitPrice: pricing.unitPrice,
          offerPricing: pricing.offerPricing,
        });
      }
    }

    const originalSubtotal = items.reduce((s, i) => s + i.originalPrice * i.quantity, 0);
    const subtotal         = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const offerSavings     = originalSubtotal - subtotal;

    const shipping = subtotal === 0 ? 0 : (subtotal >= 500 ? 0 : 99);
    const tax      = Math.round(subtotal * 0.08);
    const total    = subtotal + shipping + tax;

    return {
      cart: { items },
      addresses,
      selectedAddressId: selectedAddress?._id || null,
      originalSubtotal,
      offerSavings,
      subtotal,
      shipping,
      tax,
      total,
    };
  } catch (error) {
    throw error;
  }
}

export const placeOrder = async (userId, addressId, paymentMethod, couponCode = null, buyNowItem = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const address = await Address.findOne({ _id: addressId, userId, isDeleted: false }).session(session);
        if (!address) throw new Error("Invalid address");

        let orderItems = [];
        let subtotal = 0;
        let cart = null;

        if (buyNowItem) {
            const product = await Product.findById(buyNowItem.productId).session(session);
            if (!product) throw new Error("Product not found");
            if (product.isDeleted) throw new Error(`${product.productName} is unavailable`);
            if (product.isBlocked) throw new Error(`${product.productName} is blocked`);

            const variant = product.variants.find(v => v.size === buyNowItem.size);
            if (!variant) throw new Error("Variant not found");
            if (variant.stock < buyNowItem.quantity) {
                throw new Error(`${product.productName} has only ${variant.stock} stock left`);
            }

            const offerPricing = await calculateProductOffer(
            product,
          variant.price
             );

const hasOffer =
    offerPricing?.offer &&
    Number(offerPricing.discountAmount) > 0;

const regularPrice = variant.price;

const salePrice = hasOffer
    ? Number(offerPricing.salePrice)
    : regularPrice;

const totalPrice = salePrice * buyNowItem.quantity;

subtotal += totalPrice;

orderItems.push({
    product: product._id,
    productName: product.productName,
    size: buyNowItem.size,
    quantity: buyNowItem.quantity,
    regularPrice,
    salePrice,
    totalPrice,
});

        } else {
            cart = await Cart.findOne({ userId }).populate("items.productId").session(session);
            if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

            for (const item of cart.items) {
                const product = item.productId;               
                if (!product) throw new Error("Product not found");
                if (product.isDeleted) throw new Error(`${product.productName} is unavailable`);
                if (product.isBlocked) throw new Error(`${product.productName} is blocked`);

                const variant = product.variants.find(v => v.size === item.size);
                if (!variant) throw new Error("Variant not found");
                if (variant.stock < item.quantity) {
                    throw new Error(`${product.productName} has only ${variant.stock} stock left`);
                }

                const offerPricing = await calculateProductOffer(
    product,
    variant.price
);

const hasOffer =
    offerPricing?.offer &&
    Number(offerPricing.discountAmount) > 0;

const regularPrice = variant.price;

const salePrice = hasOffer
    ? Number(offerPricing.salePrice)
    : regularPrice;

const totalPrice = salePrice * item.quantity;

subtotal += totalPrice;

orderItems.push({
    product: product._id,
    productName: product.productName,
    size: item.size,
    quantity: item.quantity,
    regularPrice,
    salePrice,
    totalPrice,
})
            }
        }

       const shipping = subtotal >= 500 ? 0 : 99;
       const tax = Math.round(subtotal * 0.08);

       let discount = 0;
       let appliedCouponCode = null;

     if (couponCode) {
      const couponResult = await validateCoupon(couponCode, subtotal);

     discount = couponResult.discount;
    appliedCouponCode = couponResult.couponCode;
}

const grandTotal = subtotal + shipping + tax - discount;
        const order = await Order.create([{
            userId, items: orderItems,address, paymentMethod,
            couponCode:appliedCouponCode,
            subTotal:subtotal,shipping, tax, discount,
            grandTotal, orderStatus: "Pending",
            paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
        }], { session });

        if (buyNowItem) {
            await Product.updateOne(
                { _id: buyNowItem.productId, "variants.size": buyNowItem.size },
                { $inc: { "variants.$.stock": -buyNowItem.quantity } },
                { session }
            );
        } else {
            for (const item of cart.items) {
                await Product.updateOne(
                    { _id: item.productId._id, "variants.size": item.size },
                    { $inc: { "variants.$.stock": -item.quantity } },
                    { session }
                );
            }
            cart.items = [];
            await cart.save({ session });
        }

        await session.commitTransaction();
        return { success: true, orderId: order[0]._id, message: "Order placed successfully" };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

export const validateCheckout = async (userId,buyNowItem=null) => {

    if (buyNowItem) {

    const product = await Product.findById(buyNowItem.productId);

    if (!product) {
      return {
        success: false,
        message: "Product is no longer available."
      };
    }

    if (product.isDeleted || product.isBlocked) {
      return {
        success: false,
        message: `${product.productName} is currently unavailable.`
      };
    }

    const variant = product.variants.find(
      v => v.size === buyNowItem.size
    );

    if (!variant) {
      return {
        success: false,
        message: `${product.productName} (${buyNowItem.size}) is unavailable.`
      };
    }

    if (variant.status !== "ACTIVE") {
      return {
        success: false,
        message: `${product.productName} (${buyNowItem.size}) is unavailable.`
      };
    }

    if (variant.stock <= 0) {
      return {
        success: false,
        message: `${product.productName} (${buyNowItem.size}) is out of stock.`
      };
    }

    if (variant.stock < buyNowItem.quantity) {
      return {
        success: false,
        message:
          `${product.productName} has only ${variant.stock} stock left.`
      };
    }

    return {
      success: true
    };
  }


  const cart = await Cart.findOne({ userId })
    .populate("items.productId");

  if (!cart || cart.items.length === 0) {
    return {
      success: false,
      message: "Your cart is empty."
    };
  }

  for (const item of cart.items) {

    const product = item.productId;

    if (!product) {
      return {
        success: false,
        message: "A product in your cart is no longer available."
      };
    }

    if (product.isDeleted || product.isBlocked) {
      return {
        success: false,
        message: `${product.productName} is currently unavailable.`
      };
    }

    const variant = product.variants.find(
      v => v.size === item.size
    );

    if (!variant) {
      return {
        success: false,
        message: `${product.productName} (${item.size}) is unavailable.`
      };
    }

    if (variant.status !== "ACTIVE") {
      return {
        success: false,
        message: `${product.productName} (${item.size}) is unavailable.`
      };
    }

    if (variant.stock <= 0) {
      return {
        success: false,
        message: `${product.productName} (${item.size}) is out of stock.`
      };
    }

    if (variant.stock < item.quantity) {
      return {
        success: false,
        message:
          `${product.productName} has only ${variant.stock} stock left.`
      };
    }
  }

  return {
    success: true
  }
}

export const validateCoupon=async(couponCode,subTotal)=>{

  if(!couponCode||!couponCode.trim()){
    throw new Error("Please enter a coupon code")
  }
  const code=couponCode.trim().toUpperCase()
  const coupon=await Coupon.findOne({code})


  if(!coupon){
    throw new Error("Invalid coupon code")
  }
  if(coupon.isDisabled){
    throw new Error("This coupon is disabled")
  }
  const now=new Date()
  if(now>new Date(coupon.expiryDate)){
    throw new Error("This coupon has Expired")
  }
  if(subTotal<coupon.minPurchase){
    throw new Error(`minimum purchase is ₹${coupon.minPurchase} `)
  }
  let discount=0
  if(coupon.discountType==="PERCENTAGE"){
    discount=subTotal*coupon.discountValue/100

    if(coupon.maxDiscount!==null&&coupon.maxDiscount!==undefined){
      discount=Math.min(discount,coupon.maxDiscount)
    }
  }else if(coupon.discountType==="FIXED"){
    discount=coupon.discountValue
  }
  discount=Math.min(discount,subTotal)
  
  return{
    success:true,
    message:"Coupon applied successfully",
    couponCode:coupon.code,
    discount,
    finalSubtotal:subTotal-discount
  }
}