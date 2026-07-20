import express from "express";
import * as checkoutController from "../controllers/user/checkoutController.js"
import { isUserAuth } from "../middlewares/userAuth.js";

const router=express.Router()

router.get("/checkout",isUserAuth,checkoutController.loadCheckout)
router.post("/place-order",isUserAuth,checkoutController.placeOrder)

export default router