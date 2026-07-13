import * as shopService from "../../services/user/shopService.js";

export const loadShop = async (req, res) => {

  try {

    const data =
      await shopService.getShopProducts(
        req.query,
        req.session.user
      );
console.log(req.query);
    res.render(
      "user/product/productCategory",
      data
    );

  } catch (error) {

    console.log(error);

    res.redirect("/pageNotFound");

  }

}