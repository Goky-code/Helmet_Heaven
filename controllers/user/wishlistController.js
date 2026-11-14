import * as wishlistService from "../../services/user/wishlistService.js"
import Category from "../../models/categoryModel.js";
import HTTP_STATUS from "../../utils/httpStatus.js";

export const loadWishlist = async (req, res) => {

  try {

    const page=parseInt(req.query.page)||1
    const limit=5

    const data =
      await wishlistService.getWishlist(
        req.session.user,page,limit)

        const categories = await Category.find({
    isListed: true,
    isDeleted: false
})
.sort({ name: 1 })
.limit(4);

    res.render(
      "user/wishlist",{  data,
    wishlist: data.wishlist,
    categories,
    cartCount: data.cartCount,
    wishlistCount: data.wishlistCount,
    totalItems: data.totalItems,
    totalPages: data.totalPages,
    currentPage: data.currentPage,
    perPage: data.perPage})

  } catch (error) {

    console.log(error);

    res.redirect("/user/homepage");

  }

}

export const addToWishlist = async (
  req,
  res
) => {

  try {

    const wishlistCount =
      await wishlistService.addWishlistItem(
        req.session.user,
        req.params.id,
        req.body.size
      );

    res.json({
      success: true,
      message: "Added to wishlist",
      wishlistCount,
    });

  } catch (error) {

    console.log(error);

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });

  }

};

export const removeWishlist = async (
  req,
  res
) => {

  try {

    const wishlistCount =
      await wishlistService.removeWishlistItem(
        req.session.user,
        req.params.id,
        req.body.size
      );

    res.json({
      success: true,
      message: "Removed from wishlist",
      wishlistCount,
    });

  } catch (error) {

    console.log(error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });

  }

};

export const getWishlistCount = async (
  req,
  res
) => {

  try {

    const count =
      await wishlistService.getWishlistItemCount(
        req.session.user
      );

    res.json({
      success: true,
      count,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      count: 0,
    });

  }

}

export const clearWishlist = async (req, res) => {
  try {
    const wishlistCount = await wishlistService.clearWishlist(req.session.user);

    res.json({
      success: true,
      message: "Wishlist cleared",
      wishlistCount,
    });
  } catch (error) {
    console.log(error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};