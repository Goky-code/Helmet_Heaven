import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";

export const setNavCounts = async (req, res, next) => {
  try {
    // req.session.user may be stored as just the ID string,
    // or as an object with ._id — handle both cases
    const userId = req.session.user?._id || req.session.user;

    if (userId) {
      const [cart, wishlist] = await Promise.all([
        Cart.findOne({ userId }),
        Wishlist.findOne({ userId })
      ]);

      // cart.items — matches your cartModel (items array with quantity field)
      res.locals.cartCount = cart
        ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;

      // wishlist.products — matches your wishlistModel
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