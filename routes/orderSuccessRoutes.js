import express from "express";
import * as orderSuccessController from "../controllers/user/orderSucessController.js"
import { isUserAuth } from "../middlewares/userAuth.js";

const router = express.Router();

router.get("/checkout/order-success", isUserAuth,orderSuccessController.loadOrderSuccess)


export default router;