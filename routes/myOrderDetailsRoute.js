import express from "express"
import * as myOrderDetailsController from "../controllers/user/myOrderDetailsController.js"
import { isUserAuth } from "../middlewares/userAuth.js"

const router= express.Router()

router.get("/orders/:orderId",isUserAuth,myOrderDetailsController.loadOrderDetails)
router.post("/orders/:orderId/cancel",isUserAuth,myOrderDetailsController.cancelOrder)
router.get("/orders/:orderId/return", isUserAuth,myOrderDetailsController.returnOrder)
router.get("/orders/:orderId/invoice", isUserAuth,myOrderDetailsController.downloadInvoice)

export default router