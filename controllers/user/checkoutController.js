import * as checkoutService from "../../services/user/checkoutService.js";
import HTTP_STATUS from "../../utils/httpStatus.js"

export const loadCheckout=async(req,res)=>{
    try{
        const userId=req.session.user
        const data=await checkoutService.getCheckoutData(userId)
        return res.render("user/checkout/checkoutPage",data)
    }catch(error){
        console.log(error)
        res.redirect("/user/cart")
    }
}

export const placeOrder=async(req,res)=>{
    try{
        const userId=req.session.user
        const{addressId,paymentMethod,couponCode}=req.body
        const result=await checkoutService.placeOrder(
            userId,
            addressId,
            paymentMethod,
            couponCode
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

    const {
        redirect,
        name,
        street,
        apartment,
        city,
        state,
        zip,
        phone
    } = req.body;

    await Address.create({
        userId: req.session.user._id,
        name,
        street,
        apartment,
        city,
        state,
        zip,
        phone
    });

    if (redirect === "checkout") {
        return res.redirect("/user/checkout");
    }

    return res.redirect("/user/address/addresspage");

}