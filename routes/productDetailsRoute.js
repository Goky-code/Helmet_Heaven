import express from "express"
import {addToCart, loadProductDetails,getHeaderCounts} from "../controllers/user/productdetailsController.js"

import { isUserAuth } from "../middlewares/userAuth.js"
 const router=express.Router()


router.get('/product/:id', loadProductDetails)
router.get('/add-to-cart/:id',isUserAuth,addToCart)
router.get("/header-counts", getHeaderCounts);

export default router