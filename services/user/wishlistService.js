import Wishlist from "../../models/wishlistModel.js";
import Cart from "../../models/cartModel.js";

 const isItemUnavailable=(product,size)=>{
    if(!product)
      return true
    if(product.isBlocked||product.isDeleted)
      return true
    if(!product.category||!product.category.isListed||product.category.isDeleted)
      return true
    if(!product.brand||!product.brand.isListed||product.brand.isDeleted)
      return true

    const variant=product.variants.find(v=>v.size===size)
    if(!variant||variant.status!=="ACTIVE")
      return true

    return false
  }


export const getWishlist = async (userId,page=1,limit=5) => {

   const currentPage = Math.max(parseInt(page) || 1, 1);
  const perPage = Math.max(parseInt(limit) || 5, 1);

  let wishlist = await Wishlist.findOne({ userId })
   .populate({
  path: "products.productId",
  populate: [
    {path:"category"},
    {path:"brand"},
  ],
})

  if (wishlist) {

    const before = wishlist.products.length;

    wishlist.products = wishlist.products.filter(item =>!!item.productId)
    
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
        const variant=product.variants.find(v=>v.size===item.size)

        if(!variant||variant.status!=="ACTIVE"){
          return sum
        }

        return sum + item.quantity;

      }, 0)
    : 0;

  const wishlistCount = wishlist
    ? wishlist.products.reduce((sum, item) => {
    return isItemUnavailable(item.productId, item.size)?sum:sum+1
      
      }, 0)
    : 0;

 const totalItems = wishlist
    ? wishlist.products.length
    : 0;

  const totalPages = Math.ceil(
    totalItems / perPage
  );



  const safePage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;


  const skip =
    (safePage - 1) * perPage;


  const paginatedProducts = wishlist
    ? wishlist.products.slice(
        skip,
        skip + perPage
      )
    : [];


  
  const wishlistData = wishlist
    ? wishlist.toObject()
    : { products: [] };


 
  wishlistData.products = paginatedProducts;


  return {

    wishlist: wishlistData,

    cartCount,
    wishlistCount,

    totalItems,
    totalPages,
    currentPage: safePage,
    perPage,

  }
}

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
    return 0
  }

  const wishlist =
    await Wishlist.findOne({ userId })
     .populate({
      path: "products.productId",
      populate: [
        { path: "category" },
        { path: "brand" },
      ],
    });


  const count = wishlist
    ? wishlist.products.filter(item =>!isItemUnavailable
      (item.productId,item.size)).length
    : 0;

  return count;
}