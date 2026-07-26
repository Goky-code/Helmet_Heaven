import * as paymentService from "../../services/user/paymentService.js"
import HTTP_STATUS from "../../utils/httpStatus.js"

export const loadPayment=async(req,res)=>{
    try{
        const userId=req.session.user
        const {addressId}=req.query

        const data=await paymentService.getPaymentPage(userId,addressId)

        res.render("user/checkout/paymentPage",data)
    }catch(error){
         console.log(error);

    res.redirect("/pageerror")

    }
}

export const placeOrder=async(req,res)=>{
    try{
        const userId=req.session.user

        const{addressId,paymentMethod}=req.body

        const result=await paymentService.placeOrder(userId,addressId,paymentMethod)

        res.status(HTTP_STATUS.CREATED).json(result)
    }catch(error){
        console.log(error)
        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success:false,
            message:error.message,
        })

    }
}