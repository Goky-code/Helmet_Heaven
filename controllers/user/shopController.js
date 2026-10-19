import * as shopService from "../../services/user/shopService.js";
import {
  calculateProductOffer
} from "../../services/admin/offerService.js";

export const loadShop = async (req, res) => {

  try {

    const data =
      await shopService.getShopProducts(
        req.query,
        req.session.user
      );

 const productsWithOffers=await Promise.all(data.
  products.map(async product=>{
    const item=typeof product.toObject==="function"
    ?product.toObject():product

    const activeVariant=item._activeVariant
    let offerPricing = null
     
        if (
          activeVariant &&
          activeVariant.status === "ACTIVE" &&
          activeVariant.stock > 0
        ) {
          offerPricing = await calculateProductOffer(
            item,
            activeVariant.price
          );
        }

    return{
      ...item,offerPricing
    }

  })
)
console.log(req.query)

res.render("user/product/productCategory",{
  ...data,
  products:productsWithOffers
})
  }catch(error){
    console.log(error)
    res.redirect("/pageNotFound")
  }
}