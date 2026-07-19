
import express from "express";
import {loadOrders,loadOrderDetails,updateOrderStatus} from "../controllers/orderController.js"; 
import { isAdminAuth} from "../middlewares/adminAuth.js";
 
const router = express.Router();
 
router.get("/orders", isAdminAuth, loadOrders);
router.get("/orders/:id", isAdminAuth,loadOrderDetails);
router.patch("/orders/:id/status", isAdminAuth, updateOrderStatus);
 
export default router;
 