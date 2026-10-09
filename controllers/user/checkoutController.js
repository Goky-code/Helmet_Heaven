import * as checkoutService from "../../services/user/checkoutService.js";
import Coupon from "../../models/couponModel.js"
import Address from "../../models/addressModel.js";
import HTTP_STATUS from "../../utils/httpStatus.js"

export const loadCheckout=async(req,res)=>{
    try{
        const userId=req.session.user

         const { buyNow, productId, size, qty } = req.query
         const buyNowItem = (buyNow === 'true' && productId && size)
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null

            if (!buyNowItem) {

      const validation =
        await checkoutService.validateCheckout(userId);

      if (!validation.success) {

        return res.redirect(
          `/user/cart?error=${encodeURIComponent(validation.message)}`
        )
      }
    }

        const data=await checkoutService.getCheckoutData(userId,buyNowItem)
        return res.render("user/checkout/checkoutPage",{ ...data, isBuyNow: !!buyNowItem, buyNowItem })
    }catch(error){
        console.log(error)
        res.redirect("/user/cart")
    }
}

export const placeOrder=async(req,res)=>{
    try{
        const userId=req.session.user
        const{addressId,paymentMethod,couponCode,buyNow,productId,size,qty}=req.body 
        const buyNowItem = (buyNow === true || buyNow === 'true')
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null;
         
        const result=await checkoutService.placeOrder(
            userId,
            addressId,
            paymentMethod,
            couponCode,
            buyNowItem
        )
        return res.json(result)
    }catch(error){
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,
            message:"something went wrong"
        })
    }
}

export const loadAddAddress = (req, res) => {

    res.render("user/address/addNewAddress", {
        redirect: req.query.redirect || ""
    });

}

export const addAddress = async (req, res) => {
  try {
    const userId = req.session.user; 
    const { redirect, name, street, apartment, city, state, zip, phone, isDefault } = req.body;

    
    if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const newAddress = await Address.create({
      userId,
      name,
      street,
      apartment,
      city,
      state,
      zip,
      phone,
      isDefault: !!isDefault
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        address: newAddress
      });
    }

    if (redirect === "checkout") {
      return res.redirect("/user/checkout");
    }
    return res.redirect("/user/address/addresspage");

  } catch (error) {
    console.log(error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Failed to save address. Please try again."
      });
    }
    return res.redirect("/user/address/addresspage");
  }
}

export const validateCheckout = async (req, res) => {
    try {

        const userId = req.session.user;

        const {
            buyNow,
            productId,
            size,
            qty
        } = req.body;

        const buyNowItem =
            (buyNow === true || buyNow === "true")
                ? {
                    productId,
                    size,
                    quantity: Math.max(
                        1,
                        parseInt(qty) || 1
                    )
                }
                : null;

        const result =
            await checkoutService.validateCheckout(
                userId,
                buyNowItem
            );

        return res.json(result);

    } catch (error) {

        console.log(error);

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Unable to validate product availability."
        })
    }
}

export const applyCoupon=async(req,res)=>{
    try{
        const userId=req.session.user
        const{couponCode,buyNow,productId,size,qty}=req.body

        const buyNowItem=buyNow===true||buyNow==="true"?{
            productId,size,quantity:Math.max(1,parseInt(qty)||1)
        }:null
        const checkoutData=await checkoutService.getCheckoutData(userId,
            buyNowItem
        )
      console.log("========== COUPON DEBUG ==========");
console.log("Coupon:", couponCode);
console.log("Checkout subtotal:", checkoutData.subtotal);
console.log("==================================");

        const result=await checkoutService.validateCoupon(couponCode,
            checkoutData.subtotal
        )
        console.log("========== COUPON RESULT ==========");
console.log(result);
console.log("discount:", result.discount);
console.log("==================================");
        return res.json({
            ...result,
          subtotal: checkoutData.subtotal,
            shipping: checkoutData.shipping,
            tax: checkoutData.tax,
            total: checkoutData.total - result.discount
        })
    }catch(error){
         console.log("========== APPLY COUPON ERROR ==========");
    console.log(error);
    console.log("========================================");
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,
            message:error.message||"unable to apply coupon"
        })
    }
}

export const getAvailableCoupons=async(req,res)=>{
    try{
        const now=new Date()

        const coupons=await Coupon.find({
            isDisabled:false,
            startDate:{$lte:now},
            expiryDate:{$gte:now}
        })
        .select("name code description discountType discountValue maxDiscount minPurchase expiryDate")
        .sort({createdAt:-1})
        .lean()

        return res.json({
            success:true,
            coupons
        })
    }catch(error){
         console.error("Get available coupons error:", error)

         return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success:false,
            message:"Unable to load avaliable coupons"
         })
    }
}