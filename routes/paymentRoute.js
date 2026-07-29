import express from "express";
import * as paymentController from "../controllers/user/paymentController.js"
import { isUserAuth } from "../middlewares/userAuth.js";

const router = express.Router();

router.get(
    "/payment",
    isUserAuth,
    paymentController.loadPayment
);

router.post(
    "/place-orders",
    isUserAuth,
    paymentController.placeOrder
);
router.get("/order-success", isUserAuth, paymentController.loadOrderSuccess);
 

export default router;