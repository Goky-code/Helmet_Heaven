import Product from "../../models/productModel.js"

export const loadProductDetails = async (req, res) => {
  try {

    const productId = req.params.id

    const product = await Product.findById(productId)
      .populate("category")
      .populate("brand")

   
    if (!product) {
      return res.redirect("/shop")
    }

    
    if (product.isBlocked || product.isDeleted) {
      return res.redirect("/shop")
    }

    
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category._id,
      isBlocked: false
    }).limit(4)

    res.render("user/product/productDetails", {
      product,
      relatedProducts
    })

  } catch (error) {
    console.log(error)
    res.redirect("/shop")
  }
}