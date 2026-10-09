import express from "express";
import * as paymentController from "../controllers/user/paymentController.js"
import { isUserAuth } from "../middlewares/userAuth.js";
import { nocache } from "../middlewares/nocache.js";

const router = express.Router();

router.get("/payment",isUserAuth,nocache,paymentController.loadPayment)

router.post("/place-orders",isUserAuth,paymentController.placeOrder)
router.get("/checkout/order-success", isUserAuth, paymentController.loadOrderSuccess);
router.post("/razorpay/create-order",isUserAuth,paymentController.createRazorpayOrder)

router.post("/razorpay/verify",isUserAuth, paymentController.verifyRazorpayPayment)
 

export default router