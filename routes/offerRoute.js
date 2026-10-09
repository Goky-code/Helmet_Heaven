import express from "express"
import  * as offerController from "../controllers/offerController.js"
const router=express.Router()

router.get("/offers",offerController.loadOffers)
router.get("/offers/create",offerController.loadCreateOffer)
router.post("/offers/create",offerController.createNewOffer)
router.get("/offers/edit/:id",offerController.loadEditOffer)
router.post("/offers/edit/:id",offerController.updateExistingOffer)
router.post("/offer/toggle-status/:id",offerController.toggleStatus)

export default router