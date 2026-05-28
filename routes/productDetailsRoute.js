import express from "express"
import {loadProductDetails} from "../controllers/user/productdetailsController.js"
 const router=express.Router()


router.get('/product/:id', loadProductDetails)
 export default router