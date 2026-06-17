import Product from "../../models/productModel.js";
import Wishlist from "../../models/wishlistModel.js";
import Cart from "../../models/cartModel.js";

export const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user; 

    const product = await Product.findById(productId)
      .populate("category")
      .populate("brand");

    if (!product)
       return res.redirect("/shop");

    if (product.isBlocked || product.isDeleted)
       return res.redirect("/shop");

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

export const addToCart = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Please login to add items to cart" });
    }

    const productId = req.params.id;
    const { size, quantity } = req.body;

    if (!size) {
      return res.status(400).json({ success: false, message: "Please select a size" });
    }

    
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

   
    const product = await Product.findById(productId);
    if (!product || product.isBlocked || product.isDeleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    
    const variant = product.variants.find(v => v.size === size && v.status === "ACTIVE");
    if (!variant) {
      return res.status(400).json({ success: false, message: "Selected size is not available" });
    }

   
    if (variant.stock < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${variant.stock} item(s) left in stock` 
      });
    }

   
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

   
    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.size === size
    );

    if (existingIndex > -1) {
     
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > variant.stock) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot add more. Only ${variant.stock} in stock` 
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
    
      cart.items.push({
        productId,
        size,
        quantity: qty,
        price: variant.price,
      });
    }

    await cart.save();

    return res.status(200).json({ success: true, message: "Added to cart" });

  } catch (error) {
    console.error("[addToCart]", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};