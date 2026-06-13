import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";

export const setNavCounts = async (req, res, next) => {
  try {
    
    const userId = req.session.user?._id || req.session.user;

    if (userId) {
      const [cart, wishlist] = await Promise.all([
        Cart.findOne({ userId }),
        Wishlist.findOne({ userId })
      ]);

     
      res.locals.cartCount = cart
        ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;

      res.locals.wishlistCount = wishlist
        ? wishlist.products.length
        : 0;
    } else {
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
    }
  } catch (err) {
    console.error("setNavCounts error:", err);
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;
  }

  next();
};