import * as wishlistService from "../../services/user/wishlistService.js"
import HTTP_STATUS from "../../utils/httpStatus.js";

export const loadWishlist = async (req, res) => {

  try {

    const data =
      await wishlistService.getWishlist(
        req.session.user
      );

    res.render(
      "user/wishlist",
      data
    );

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