import Cart from "../../models/cartModel.js";
import Product from "../../models/productModel.js";
// import Wishlist from "../../models/wishlistModel.js";

export const loadCart = async (req, res) => {
  try {
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId })
      .populate("items.productId");

    res.render("user/product/cartPage", {
      cart: cart || { items: [] }
    });

  } catch (error) {
    console.log(error);
    res.redirect("/user/homepage");
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    const { size, quantity = 1 } = req.body;   // ← read from body

    if (!size) {
      return res.status(400).json({ success: false, message: "Please select a size" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

   if (product.isBlocked || product.isDeleted) {
  return res.status(400).json({ success: false, message: "Product unavailable" });
}

    // ← find the specific variant, not product.quantity
    const variant = product.variants.find(
      v => v.size === size && v.status === "ACTIVE"
    );

    if (!variant || variant.stock <= 0) {
      return res.status(400).json({ success: false, message: "Out of stock" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, size, quantity: 1 }]   // ← store size
      });
    } else {
      const itemIndex = cart.items.findIndex(
  item => item.productId.toString() === productId && item.size === size  
);

      if (itemIndex > -1) {
        const currentQty = cart.items[itemIndex].quantity;

        if (currentQty >= 5) {
          return res.status(400).json({ success: false, message: "Maximum 5 quantity allowed" });
        }
        if (currentQty + 1 > variant.stock) {
          return res.status(400).json({ success: false, message: "Stock limit exceeded" });
        }

        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ productId, size, quantity: 1 });
      }
    }

    await cart.save();

    return res.json({ success: true, message: "Added to cart" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCartQuantity = async (req, res) => {

  try {

    const userId = req.session.user;

    const {
      productId,
      count
    } = req.body;

    const cart = await Cart.findOne({ userId });

    const product = await Product.findById(productId);

    const item = cart.items.find(
      item => item.productId.toString() === productId && item.size === size  
    );

    if (!item) {
      return res.json({
        success: false
      });
    }

    const newQty = item.quantity + count;

    // MIN LIMIT
    if (newQty < 1) {
      return res.json({
        success: false,
        message: "Minimum quantity is 1"
      });
    }

    // MAX LIMIT
    if (newQty > 5) {
      return res.json({
        success: false,
        message: "Maximum quantity is 5"
      });
    }

    // STOCK LIMIT
    if (newQty > product.quantity) {
      return res.json({
        success: false,
        message: "Stock exceeded"
      });
    }

    item.quantity = newQty;

    await cart.save();

    res.json({
      success: true,
      quantity: item.quantity
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, size } = req.body;

    await Cart.updateOne(
      { userId },
      { $pull: { items: { productId, size } } }
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error" });
  }
};