import * as orderSuccessService from "../../services/user/orderSuccessService.js";

export const loadOrderSuccess = async (req, res) => {
    try {
        const { orderId } = req.query;
        const userId = req.session.user;

        if (!orderId) {
            return res.redirect("/user/homepage");
        }

        const order = await orderSuccessService.getOrderSuccessDetails(orderId, userId);

        if (!order) {
            return res.redirect("/user/homepage");
        }

        res.render("user/checkout/order-success", {
            order,
            cartCount: 0,
            wishlistCount: 0
        });
    } catch (error) {
        console.error("Error loading order success page:", error);
        res.redirect("/pageerror");
    }
}