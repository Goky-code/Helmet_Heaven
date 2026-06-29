import Wishlist from "../../models/wishlistModel.js";
import Product from "../../models/productModel.js";
import Cart from "../../models/cartModel.js";

export const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;

    const wishlist = await Wishlist.findOne({ userId }).populate(
      "products.productId"
    );

    if (wishlist) {
      const before = wishlist.products.length;
      wishlist.products = wishlist.products.filter(item => item.productId != null);
      if (wishlist.products.length !== before) {
        await wishlist.save();
      }
    }

    const cartDoc = await Cart.findOne({ userId }).populate("items.productId");
    const cartCount = cartDoc
      ? cartDoc.items.reduce((sum, item) => {
          const p = item.productId;
          if (!p || p.isBlocked || p.isDeleted) return sum;
          return sum + item.quantity;
        }, 0)
      : 0;

    const wishlistCount = wishlist
      ? wishlist.products.reduce((sum, item) => {
          const p = item.productId;
          if (!p || p.isBlocked || p.isDeleted) return sum;
          return sum + 1;
        }, 0)
      : 0;

    res.render("user/wishlist", {
      wishlist: wishlist || { products: [] },
      cartCount,
      wishlistCount,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/user/homepage");
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    const { size } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Please login" });

    if (!size)
      return res
        .status(400)
        .json({ success: false, message: "Please select a size first" });

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
  wishlist = new Wishlist({
    userId,
    products: [{ productId, size }],
  });

  await wishlist.save();

  return res.json({
    success: true,
    message: "Added to wishlist",
    wishlistCount: wishlist.products.length
  });
}
    
    const exists = wishlist.products.find(
      (item) =>
        item.productId.toString() === productId && item.size === size
    );

    if (exists)
      return res.json({
        success: false,
        message: "This size is already in your wishlist",
      });

    wishlist.products.push({ productId, size });
    await wishlist.save();

    res.json({ success: true, message: "Added to wishlist", wishlistCount: wishlist.products.length});
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const removeWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    const { size } = req.body; 

    if (!size) {
      
      await Wishlist.updateOne(
        { userId },
        { $pull: { products: { productId } } }
      );
    } else {
     
      await Wishlist.updateOne(
        { userId },
        { $pull: { products: { productId, size } } }
      );
    }

   const wishlist = await Wishlist.findOne({ userId });

res.json({
  success: true,
  message: "Removed from wishlist",
  wishlistCount: wishlist ? wishlist.products.length : 0
});
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getWishlistCount = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.json({ success: true, count: 0 });
    }

    const wishlist = await Wishlist.findOne({ userId }).populate("products.productId");

    const count = wishlist
      ? wishlist.products.reduce((sum, item) => {
          const p = item.productId;
          if (!p || p.isBlocked || p.isDeleted) return sum;
          return sum + 1;
        }, 0)
      : 0;

    res.json({ success: true, count });
  } catch (error) {
    res.json({ success: false, count: 0 });
  }
};