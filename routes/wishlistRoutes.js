import express from 'express'
import {
  addToWishlist,
  removeWishlist,
  loadWishlist,
} from "../controllers/user/wishlistController.js"
import { isUserAuth } from "../middlewares/userAuth.js"

const router=express.Router()

router.get("/wishlist", isUserAuth, loadWishlist);

router.post(
  "/add-to-wishlist/:id",
  isUserAuth,
  addToWishlist
);

router.delete(
  "/remove-wishlist/:id",
  isUserAuth,
  removeWishlist
);

export default router