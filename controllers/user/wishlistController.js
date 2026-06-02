import Wishlist from "../../models/wishlistModel.js";
import Product from "../../models/productModel.js";

export const loadWishlist = async (req, res) => {
  try {

    const userId = req.session.user;

    const wishlist = await Wishlist.findOne({ userId })
      .populate("products.productId");

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

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login",
      });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        products: [{ productId }],
      });

      await wishlist.save();

      return res.json({
        success: true,
        message: "Added to wishlist",
      });
    }

    const exists = wishlist.products.find(
      item => item.productId.toString() === productId
    );

    if (exists) {
      return res.json({
        success: false,
        message: "Already in wishlist",
      });
    }

    wishlist.products.push({ productId });

    await wishlist.save();

    res.json({
      success: true,
      message: "Added to wishlist",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const removeWishlist = async (req, res) => {
  try {

    const userId = req.session.user;
    const productId = req.params.id;

    await Wishlist.updateOne(
      { userId },
      {
        $pull: {
          products: { productId }
        }
      }
    );

    res.json({
      success: true,
      message: "Removed from wishlist",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};