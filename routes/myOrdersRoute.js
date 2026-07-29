 import express from "express"
 import {loadMyOrders} from "../controllers/user/myOrderController.js"
import { isUserAuth } from "../middlewares/userAuth.js"
 
const router = express.Router()

router.get("/myOrders",isUserAuth,loadMyOrders)

export default router