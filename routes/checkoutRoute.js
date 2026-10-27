import express from "express";
import * as checkoutController from "../controllers/user/checkoutController.js"
import { isUserAuth } from "../middlewares/userAuth.js"
import { nocache } from "../middlewares/nocache.js";

const router=express.Router()

router.get("/checkout",isUserAuth,nocache,checkoutController.loadCheckout)
router.post("/place-order",isUserAuth,checkoutController.placeOrder)
router.get('/address/add',isUserAuth,checkoutController.loadAddAddress)
router.post(  "/address/add",isUserAuth, checkoutController.addAddress)
router.post("/checkout/validate",isUserAuth,checkoutController.validateCheckout)
router.post("/apply-coupon",isUserAuth,checkoutController.applyCoupon)
router.get("/available-coupons",isUserAuth,checkoutController.getAvailableCoupons)

export default router