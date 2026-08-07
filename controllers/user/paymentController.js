import * as paymentService from "../../services/user/paymentService.js";
import HTTP_STATUS from "../../utils/httpStatus.js";
 
export const loadPayment = async (req, res) => {
    try {
        const userId = req.session.user
        const addressId = req.query.addressId || req.body.addressId
           const { buyNow, productId, size, qty } = req.query;
        const buyNowItem = (buyNow === 'true' && productId && size)
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null
 
        const data = await paymentService.getPaymentPageData(userId, addressId,buyNowItem)
 
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
        const { addressId, paymentMethod,buyNow,productId,size,qty } = req.body;
 
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

         const buyNowItem = (buyNow === true || buyNow === 'true')
            ? { productId, size, quantity: Math.max(1, parseInt(qty) || 1) }
            : null;

 
        const result = await paymentService.placeOrder(userId, addressId, paymentMethod,buyNowItem)
 
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
        const userId = req.session.user;
        const { orderId } = req.query;
 
        if (!orderId) {
            return res.redirect("/user/orders");
        }
 
        const order = await paymentService.getOrderSuccessData(userId, orderId);
 
        if (!order) {
            return res.redirect("/user/orders");
        }
 
        return res.render("user/checkout/order-success", { order });
    } catch (error) {
        console.log(error);
        res.redirect("/user/orders");
    }
}