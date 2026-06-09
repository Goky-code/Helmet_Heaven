import Wishlist from "../../models/wishlistModel.js";
import Product from "../../models/productModel.js";


export const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;

    const wishlist = await Wishlist.findOne({ userId }).populate(
      "products.productId"
    );

    res.render("user/wishlist", {
      wishlist: wishlist || { products: [] },
    });
  } catch (error) {
    console.log(error);
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    const { size } = req.body;

    if (!userId)
      return res.status(401).json({ success: false, message: "Please login" });

    // ── size is mandatory for wishlist ──
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
      return res.json({ success: true, message: "Added to wishlist" });
    }

    // ── Check BOTH productId AND size — treat each size as a distinct entry ──
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

    res.json({ success: true, message: "Added to wishlist" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const removeWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    const { size } = req.body; // size comes in request body

    if (!size) {
      // Fallback: remove ALL size entries for this product
      // (used by wishlist page "Remove" button where size is known from the stored item)
      await Wishlist.updateOne(
        { userId },
        { $pull: { products: { productId } } }
      );
    } else {
      // ── Pull only the entry that matches BOTH productId AND size ──
      await Wishlist.updateOne(
        { userId },
        { $pull: { products: { productId, size } } }
      );
    }

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};