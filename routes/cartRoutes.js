import express from"express"
import { addToCart, loadCart, removeCartItem,updateCartQuantity,addAllToCart} from "../controllers/user/cartController.js"
import { isUserAuth } from "../middlewares/userAuth.js";


const router=express.Router()


router.get("/cart",isUserAuth,loadCart)
router.post("/add-to-cart/:id", isUserAuth, addToCart);
router.post("/update-cart",isUserAuth,updateCartQuantity)
router.post("/remove-cart-item",isUserAuth,removeCartItem)
router.post("/add-all-to-cart", isUserAuth, addAllToCart);

export default router