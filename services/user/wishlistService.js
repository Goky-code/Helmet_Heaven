import Wishlist from "../../models/wishlistModel.js";
import Cart from "../../models/cartModel.js";

export const getWishlist = async (userId) => {

  let wishlist = await Wishlist.findOne({ userId })
    .populate("products.productId");

  if (wishlist) {

    const before = wishlist.products.length;

    wishlist.products = wishlist.products.filter(
      item => item.productId !== null
    );

    if (before !== wishlist.products.length) {
      await wishlist.save();
    }
  }

  const cart = await Cart.findOne({ userId })
    .populate("items.productId");

  const cartCount = cart
    ? cart.items.reduce((sum, item) => {

        const product = item.productId;

        if (
          !product ||
          product.isBlocked ||
          product.isDeleted
        ) {
          return sum;
        }

        return sum + item.quantity;

      }, 0)
    : 0;

  const wishlistCount = wishlist
    ? wishlist.products.reduce((sum, item) => {

        const product = item.productId;

        if (
          !product ||
          product.isBlocked ||
          product.isDeleted
        ) {
          return sum;
        }

        return sum + 1;

      }, 0)
    : 0;

  return {
    wishlist: wishlist || { products: [] },
    cartCount,
    wishlistCount,
  };
};

export const addWishlistItem = async (
  userId,
  productId,
  size
) => {

  if (!userId) {
    throw new Error("Please login");
  }

  if (!size) {
    throw new Error("Please select a size first");
  }

  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {

    wishlist = new Wishlist({
      userId,
      products: [
        {
          productId,
          size,
        },
      ],
    });

    await wishlist.save();

    return wishlist.products.length;
  }

  const exists = wishlist.products.find(
    item =>
      item.productId.toString() === productId &&
      item.size === size
  );

  if (exists) {
    throw new Error(
      "This size is already in your wishlist"
    );
  }

  wishlist.products.push({
    productId,
    size,
  });

  await wishlist.save();

  return wishlist.products.length;
};

export const removeWishlistItem = async (
  userId,
  productId,
  size
) => {

  if (!size) {

    await Wishlist.updateOne(
      { userId },
      {
        $pull: {
          products: { productId },
        },
      }
    );

  } else {

    await Wishlist.updateOne(
      { userId },
      {
        $pull: {
          products: {
            productId,
            size,
          },
        },
      }
    );

  }

  const wishlist =
    await Wishlist.findOne({ userId });

  return wishlist
    ? wishlist.products.length
    : 0;
};

export const getWishlistItemCount = async (
  userId
) => {

  if (!userId) {
    return 0;
  }

  const wishlist =
    await Wishlist.findOne({ userId })
      .populate("products.productId");

  const count = wishlist
    ? wishlist.products.filter(item => {

        const product = item.productId;

        return (
          product &&
          !product.isBlocked &&
          !product.isDeleted
        );

      }).length
    : 0;

  return count;
}