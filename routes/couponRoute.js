import express from "express";
import * as couponController from "../controllers/couponController.js"

const router=express.Router()

router.get("/coupons",couponController.loadCoupons)
router.get("/add-coupon",couponController.loadAddCoupon)
router.post("/add-coupon",couponController.createCoupon)
router.get("/edit-coupon/:id",couponController.loadEditCoupon)
router.put("/edit-coupon/:id",couponController.updateCoupon)
router.patch("/delete-coupon/:id",couponController.deletCoupon)

export default router