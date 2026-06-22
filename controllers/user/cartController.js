import Cart from "../../models/cartModel.js";
import Product from "../../models/productModel.js";
import Wishlist from "../../models/wishlistModel.js";

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
    const { size, quantity = 1 } = req.body || {}  

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
    items: [{ productId, size, quantity: 1 }]
  });
} else {
  
  cart.items = cart.items.filter(item => item.size);

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

await Wishlist.updateOne(
      { userId },
      {
        $pull: {
          products: { productId }
        }
      }
    );

await cart.save();

    return res.json({ success: true, message: "Added to cart", cartCount: cart.items.length });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, size, count } = req.body;

    const cart = await Cart.findOne({ userId });
    const product = await Product.findById(productId);

    const item = cart.items.find(
      item => item.productId.toString() === productId && item.size === size
    );

    if (!item) {
      return res.json({ success: false, message: "Item not found" });
    }

    const variant = product.variants.find(v => v.size === size && v.status === "ACTIVE");

    if (!variant) {
      return res.json({ success: false, message: "Variant not found" });
    }

    const newQty = item.quantity + count;

    // If stock is 0, quantity stays at 0 — no increase or decrease allowed
    if (variant.stock === 0) {
      return res.json({ 
        success: false, 
        quantity: 0,
        message: "This item is out of stock" 
      });
    }

    // Normal minimum is 1 (stock > 0)
    if (newQty < 1) {
      return res.json({ success: false, message: "Minimum quantity is 1" });
    }

    if (newQty > 5) {
      return res.json({ success: false, message: "Maximum quantity is 5" });
    }

    // Only block increase if it exceeds stock
    if (count > 0 && newQty > variant.stock) {
      return res.json({ success: false, message: `Only ${variant.stock} item(s) in stock` });
    }

    item.quantity = newQty;
    await cart.save();

    res.json({ success: true, quantity: item.quantity });

  } catch (error) {
    console.log(error);
    res.json({ success: false });
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

    const cart = await Cart.findOne({ userId });

res.json({
  success: true,
  cartCount: cart ? cart.items.length : 0
});
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error" });
  }
};

export const addAllToCart = async (req, res) => {
  try {
    const userId = req.session.user;

   
    const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');

    if (!wishlist || wishlist.products.length === 0) {
      return res.json({ success: false, message: 'Wishlist is empty' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    for (const item of wishlist.products) {
      const product = item.productId;
      const size = item.size;

      if (!size || !product) continue;

      const variant = product.variants?.find(
        v => v.size === size && v.status === 'ACTIVE'
      );

      if (!variant || variant.stock <= 0) continue;

      const existing = cart.items.find(
        ci => ci.productId.toString() === product._id.toString() && ci.size === size
      );

      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty <= 5 && newQty <= variant.stock) {
          existing.quantity = newQty;
        }
      } else {
        cart.items.push({ productId: product._id, size, quantity: 1 });
      }
    }

    await cart.save();

    
    wishlist.products = [];
    await wishlist.save();

    return res.json({ success: true, message: 'All items moved to cart' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCartCount = async (req, res) => {
  try {
    const userId = req.session.user

    if (!userId) {
      return res.json({
        success: true,
        count: 0
      });
    }

    const cart = await Cart.findOne({ userId });

    const count = cart
 ? cart.items.reduce(
     (sum,item) =>
       sum + item.quantity,
     0
   )
 : 0

    res.json({
      success: true,
      count
    });

  } catch (error) {
    res.json({
      success: false,
      count: 0
    });
  }
};

