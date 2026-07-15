import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";

export const setNavCounts = async (req, res, next) => {
  try {
    const userId = req.session.user?._id || req.session.user;

    if (!userId) {
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
      return next();
    }

    const [cart, wishlist] = await Promise.all([
      Cart.findOne({ userId }).populate({
        path: "items.productId",
        populate: [
          { path: "category", match: { isListed: true } },
          { path: "brand", match: { isListed: true } }
        ]
      }),
      Wishlist.findOne({ userId }).populate({
        path: "products.productId",
        populate: [
          { path: "category", match: { isListed: true } },
          { path: "brand", match: { isListed: true } }
        ]
      })
    ]);

  
    res.locals.cartCount = cart
      ? cart.items.reduce((count, item) => {
          const product = item.productId;

          if (
            !product ||
            product.isDeleted ||
            product.isBlocked
          ) {
            return count;
          }

          const variant = product.variants.find(
            (v) => v.size === item.size
          );

          if (
            !variant ||
            variant.stock <= 0 ||
            variant.status !== "ACTIVE"
          ) {
            return count;
          }

          return count + item.quantity;
        }, 0)
      : 0;

    
    res.locals.wishlistCount = wishlist
      ? wishlist.products.filter((item) => {
          const product = item.productId;

          if (
            !product ||
            product.isDeleted ||
            product.isBlocked
          ) {
            return false;
          }

          const variant = product.variants.find(
            (v) => v.size === item.size
          );

          return (
            variant &&
            variant.stock > 0 &&
            variant.status === "ACTIVE"
          );
        }).length
      : 0;
  } catch (err) {
    console.error("setNavCounts error:", err);
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;
  }

  next();
};