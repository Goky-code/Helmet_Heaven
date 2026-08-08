import express from "express";
import * as checkoutController from "../controllers/user/checkoutController.js"
import { isUserAuth } from "../middlewares/userAuth.js"
import * as userController from "../controllers/userController.js"

const router=express.Router()

router.get("/checkout",isUserAuth,checkoutController.loadCheckout)
router.post("/place-order",isUserAuth,checkoutController.placeOrder)
router.get('/address/add',isUserAuth,checkoutController.loadAddAddress)
router.post(  "/address/add",isUserAuth, checkoutController.addAddress)

export default router