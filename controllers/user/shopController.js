import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Brand from "../../models/brandModels.js"

export const loadShop = async (req, res) => {

  try {

    const {
      search = "",
      category = "",
      brand = "",
      sort = "",
      page = 1
    } = req.query

    const limit = 6

    const currentPage = Number(page)

    const skip = (currentPage - 1) * limit

    // ======================
    // FILTER
    // ======================

    let filter = {
      isDeleted: false
    }

    // SEARCH

    if (search) {

      filter.productName = {
        $regex: search,
        $options: "i"
      }
    }

    // CATEGORY

    if (category) {
      filter.category = category
    }

    // BRAND

    if (brand) {
      filter.brand = brand
    }

    // ======================
    // SORT
    // ======================

    let sortOption = {}

    switch (sort) {

     case "low-high":
  sortOption["variants.price"] = 1
  break

case "high-low":
  sortOption["variants.price"] = -1
  break

      case "a-z":
        sortOption.productName = 1
        break

      case "z-a":
        sortOption.productName = -1
        break

      default:
        sortOption.createdAt = -1
    }

    // ======================
    // PRODUCTS
    // ======================

    const products = await Product.find(filter)

      .populate({
        path: "category",
        match: {
          isListed: true,
          isDeleted: false
        }
      })

      .populate({
        path: "brand",
        match: {
          isListed: true,
          isDeleted: false
        }
      })

      .sort(sortOption)

      .skip(skip)

      .limit(limit)

    // ======================
    // REMOVE INVALID
    // ======================

    const validProducts = products.filter(product => {

      if (!product.category) return false

      if (!product.brand) return false

      const activeVariants =
        product.variants.filter(
          variant =>
            variant.status === "ACTIVE" &&
            variant.stock > 0
        )

      return activeVariants.length > 0
    })

    // ======================
    // TOTAL
    // ======================

    const totalProducts =
      await Product.countDocuments(filter)

    const totalPages =
      Math.ceil(totalProducts / limit)

    // ======================
    // FILTER DATA
    // ======================

    const categories =
      await Category.find({
        isListed: true,
        isDeleted: false
      })

    const brands =
      await Brand.find({
        isListed: true,
        isDeleted: false
      })

    // ======================
    // RENDER
    // ======================
console.log(validProducts)
    res.render("user/product/productCategory", {

      products: validProducts,

      categories,

      brands,

      currentPage,

      totalPages,

      search,

      category,

      brand,

      sort
    })

  } catch (error) {

    console.log(error)

    res.redirect("/pageNotFound")
  }
}