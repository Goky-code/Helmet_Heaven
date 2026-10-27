import Razorpay from "razorpay"
import crypto from "crypto"

const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})

export const createRazorpayOrder=async({amount,receipt})=>{
    const order=await razorpay.orders.create({
        amount:Math.round(amount*100),
        currency:"INR",
        receipt,payment_capture:1
    })
    return order
}

export const verifyPaymentSignature=({
    razorpayOrderId,razorpayPaymentId,razorpaySignature
})=>{
    const body=`${razorpayOrderId}|${razorpayPaymentId}`
    const expectedSignature=crypto
           .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
           .update(body)
           .digest("hex")

           return expectedSignature===razorpaySignature
}