import express from"express"
import { addToCart } from "../controllers/user/cartController"
const router=express.Router()

router.post("/add-to-cart/:id", userAuth, addToCart);

export default router