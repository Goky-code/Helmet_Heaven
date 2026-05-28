import express from "express"
import {loadProductDetails} from "../controllers/user/productdetailsController.js"
import { loadCart } from "../controllers/user/cartController.js"
import { isUserAuth } from "../middlewares/userAuth.js"
 const router=express.Router()

router.get("/cart", isUserAuth, loadCart) 
router.get('/product/:id', loadProductDetails)
 export default router