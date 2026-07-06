import Product from "../../models/productModel.js";
import Wishlist from "../../models/wishlistModel.js";
import Cart from "../../models/cartModel.js";

export const getProductDetails = async (productId, userId) => {

  const product = await Product.findById(productId)
    .populate("category")
    .populate("brand");

  if (!product) {
    throw new Error("Product not found");
  }

  const isUnavailable =
    product.isBlocked || product.isDeleted;

  const relatedProducts = await Product.find({
    _id: { $ne: productId },
    category: product.category._id,
    isBlocked: false,
    isDeleted: false,
  }).limit(4);

  let wishlistedSizes = [];

  if (userId) {

    const wishlist =
      await Wishlist.findOne({ userId });

    if (wishlist) {

      wishlistedSizes = wishlist.products
        .filter(
          item =>
            item.productId.toString() === productId
        )
        .map(item => item.size);

    }

  }

  return {
    product,
    relatedProducts,
    wishlistedSizes,
    isUnavailable,
  }

}

export const addProductToCart = async (
  userId,
  productId,
  { size, quantity }
) => {

  if (!userId) {
    throw new Error(
      "Please login to add items to cart"
    );
  }

  if (!size) {
    throw new Error("Please select a size");
  }

  const qty = parseInt(quantity);

  if (!qty || qty < 1) {
    throw new Error("Invalid quantity");
  }

  const product =
    await Product.findById(productId);

  if (
    !product ||
    product.isBlocked ||
    product.isDeleted
  ) {
    throw new Error("Product not found");
  }

  const variant = product.variants.find(
    variant =>
      variant.size === size &&
      variant.status === "ACTIVE"
  );

  if (!variant) {
    throw new Error(
      "Selected size is not available"
    );
  }

  if (variant.stock < qty) {
    throw new Error(
      `Only ${variant.stock} item(s) left in stock`
    );
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {

    cart = new Cart({
      userId,
      items: [],
    });

  }

  const existingIndex =
    cart.items.findIndex(
      item =>
        item.productId.toString() === productId &&
        item.size === size
    );

  if (existingIndex > -1) {

    const newQty =
      cart.items[existingIndex].quantity + qty;

    if (newQty > variant.stock) {
      throw new Error(
        `Cannot add more. Only ${variant.stock} in stock`
      );
    }

    cart.items[existingIndex].quantity =
      newQty;

  } else {

    cart.items.push({
      productId,
      size,
      quantity: qty,
      price: variant.price,
    });

  }

  await cart.save();

  return true;

}