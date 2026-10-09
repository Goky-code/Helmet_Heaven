import * as paymentService from "../../services/user/paymentService.js";
import * as razorpayService from "../../services/user/razorpayService.js";
import HTTP_STATUS from "../../utils/httpStatus.js";
 
export const loadPayment = async (req, res) => {
    try {
        const userId = req.session.user

        
        const addressId = req.query.addressId || req.body.addressId;

const {
    buyNow,
    productId,
    size,
    qty,
    couponCode
} = req.query;
        const buyNowItem = (buyNow === 'true' && productId && size)
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null
 
        const data = await paymentService.getPaymentPageData(
    userId,
    addressId,
    buyNowItem,
    couponCode
)
 
        return res.render("user/checkout/paymentPage", {
            ...data,
            isBuyNow: !!buyNowItem,
            buyNowItem,
        })
    } catch (error) {
        console.log(error);
        res.redirect("/user/checkout");
    }
};
 
export const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId, paymentMethod,buyNow,productId,size,qty,couponCode } = req.body;
 
        if (!addressId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Shipping address is required.",
            });
        }
        if (!paymentMethod) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: "Please select a payment method.",
            });
        }

        const isBuyNow =
            buyNow === true ||
            buyNow === "true";

         const buyNowItem = isBuyNow&&productId&& size
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null;

 
        const result = await paymentService.placeOrder(userId, addressId, paymentMethod,couponCode||null,buyNowItem)

      
        return res.json(result);
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};
 
export const loadOrderSuccess = async (req, res) => {
    try {

         res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
        })

        const userId = req.session.user;
        const { orderId } = req.query;
 
        if (!orderId) {
            return res.redirect("/user/myOrders");
        }
 
        const order = await paymentService.getOrderSuccessData(userId, orderId);
 
        if (!order) {
            return res.redirect("/user/myOrders");
        }
 
        return res.render("user/checkout/order-success", { order });
    } catch (error) {
        console.log(error);
        res.redirect("/user/myOrders");
    }
}

export const createRazorpayOrder=async(req,res)=>{
    try{
        const userId=req.session.user
        const{
            addressId,
            buyNow,
            productId,
            size,
            qty,
            couponCode
        }=req.body

        if(!addressId){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Shipping address is required"
            })
        }

       const isBuyNow=buyNow===true||buyNow==="true"

        const buyNowItem =
            isBuyNow&&productId&&size?{
                productId,
                size,
                qty:Math.max(1, parseInt(qty) || 1)
            }:null

        const data=await paymentService.getPaymentPageData(userId,addressId,buyNowItem,couponCode||null)

        if(!data||!data.total||data.total<=0){
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success:false,
                message:"Invalid payment amount"
            })
        }
        const receipt=`receipt_${Date.now()}`
        const razorpayOrder=await razorpayService.createRazorpayOrder({
            amount:data.total,receipt
        })
        return res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            amountInRupees: data.total
        })
    }catch(error){
         console.error("Razorpay create order error:", error)
           return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: error.message || "Unable to create Razorpay order."
        })
    }
}

export const verifyRazorpayPayment=async(req,res)=>{
    try{
        const userId=req.session.user
        const{
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId,
            buyNow,
            productId,
            size,
            qty,
            couponCode
        }=req.body

        if(!razorpay_order_id||
            !razorpay_payment_id||
            !razorpay_signature){
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success:false,
                    message:"Payment details are missing"
                })
            }
            const isValid=razorpayService.verifyPaymentSignature({
                razorpayOrderId:razorpay_order_id,
                razorpayPaymentId:razorpay_payment_id,
                razorpaySignature:razorpay_signature
            })

            if(!isValid){
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success:false,
                    message:"Payment verification failed"
                })
            }
            const buyNowItem=(buyNow===true||buyNow==="true")&&productId&&size?{
                productId,size,quantity:Math.max(1,parseInt(qty)||1)
            }:null

            const result=await paymentService.placeOrder(userId,addressId,"Razorpay",couponCode||null,buyNowItem)
            return res.json({
                success: true,
            message: "Payment successful",
            orderId: result.orderId,
            redirectUrl: result.redirectUrl
            })
    }catch(error){
        console.error("Razorpay verification error",error)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
              success: false,
            message:
                error.message ||
                "Payment verification failed."
        })
    }
}