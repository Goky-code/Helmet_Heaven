import Product from "../../models/productModel.js";
import Wishlist from "../../models/wishlistModel.js";

export const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user; 

    const product = await Product.findById(productId)
      .populate("category")
      .populate("brand");

    if (!product) return res.redirect("/shop");

    if (product.isBlocked || product.isDeleted) return res.redirect("/shop");

    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category._id,
      isBlocked: false,
    }).limit(4);

   
    let wishlistedSizes = [];

    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        wishlistedSizes = wishlist.products
          .filter((item) => item.productId.toString() === productId)
          .map((item) => item.size);
      }
    }

    res.render("user/product/productDetails", {
      product,
      relatedProducts,
      wishlistedSizes, 
    });
  } catch (error) {
    console.log(error);
    res.redirect("/shop");
  }
};