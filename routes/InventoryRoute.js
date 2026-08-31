import express from "express";
import * as InventoryController from "../controllers/InventoryController.js"
import { isAdminAuth } from "../middlewares/adminAuth";

const router=express.Router()

router.get("/Inventory",isAdminAuth,InventoryController.getInventory)
router.patch("/product/:productId/variant/:variantId/stock",isAdminAuth,InventoryController.updateVariantStock)

export default router