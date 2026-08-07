import * as checkoutService from "../../services/user/checkoutService.js";
import Address from "../../models/addressModel.js";
import HTTP_STATUS from "../../utils/httpStatus.js"

export const loadCheckout=async(req,res)=>{
    try{
        const userId=req.session.user
         const { buyNow, productId, size, qty } = req.query
         const buyNowItem = (buyNow === 'true' && productId && size)
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null

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
    const userId = req.session.user; // matches how loadCheckout uses it
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
};