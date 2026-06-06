import express from"express"
import { addToCart, loadCart, removeCartItem,updateCartQuantity} from "../controllers/user/cartController.js"
import { isUserAuth } from "../middlewares/userAuth.js";
const router=express.Router()


router.get("/cart",isUserAuth,loadCart)
router.post("/add-to-cart/:id", isUserAuth, addToCart);
router.post("/update-cart",isUserAuth,updateCartQuantity)
router.post("/remove-cart-item",isUserAuth,removeCartItem)

export default router