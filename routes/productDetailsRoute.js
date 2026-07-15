import express from "express"
import {addToCart, loadProductDetails} from "../controllers/user/productdetailsController.js"

import { isUserAuth } from "../middlewares/userAuth.js"
 const router=express.Router()


router.get('/product/:id', loadProductDetails)
router.get('/add-to-cart/:id',isUserAuth,addToCart)

export default router