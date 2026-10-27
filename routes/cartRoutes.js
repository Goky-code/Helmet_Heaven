import express from"express"
import { addToCart, loadCart, removeCartItem,updateCartQuantity,addAllToCart,getCartCount,validateCheckout} from "../controllers/user/cartController.js"
import { getWishlistCount } from "../controllers/user/wishlistController.js";
import { isUserAuth } from "../middlewares/userAuth.js";


const router=express.Router()


router.get("/cart",isUserAuth,loadCart)
router.post("/add-to-cart/:id", isUserAuth, addToCart);
router.post("/update-cart",isUserAuth,updateCartQuantity)
router.delete("/remove-cart-item",isUserAuth,removeCartItem)
router.post("/add-all-to-cart", isUserAuth, addAllToCart);

router.get("/cart/count", getCartCount);
router.get("/wishlist/count", getWishlistCount);
router.get("/validate-checkout",isUserAuth,validateCheckout)

export default router