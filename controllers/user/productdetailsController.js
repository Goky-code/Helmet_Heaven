import * as productDetailsService from "../../services/user/productDetailsService.js"
import HTTP_STATUS from "../../utils/httpStatus.js";

export const loadProductDetails = async (req,res) => {

  try {

    const data =
      await productDetailsService.getProductDetails(
        req.params.id,
        req.session.user
      );

    res.render(
      "user/product/productDetails",
      data
    );

  } catch (error) {

    console.log(error);

    res.redirect("/shop");

  }

}

export const addToCart = async (req,res) => {

  try {

    await productDetailsService.addProductToCart(
      req.session.user,
      req.params.id,
      req.body
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Added to cart",
    });

  } catch (error) {

    console.log(error);

    const status =
      error.message ===
      "Please login to add items to cart"
        ? HTTP_STATUS.UNAUTHORIZED
        : HTTP_STATUS.BAD_REQUEST

    res.status(status).json({
      success: false,
      message: error.message,
    });

  }

}