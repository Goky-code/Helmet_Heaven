import Product  from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Brand    from "../../models/brandModels.js"
import Wishlist from "../../models/wishlistModel.js"

export const loadShop = async (req, res) => {
  try {
    const {
      search   = "",
      category = "",
      brand    = "",
      size     = "",
      minPrice = "",
      maxPrice = "",
      sort     = "",
      page     = 1,
    } = req.query

    const limit       = 6
    const currentPage = Math.max(1, Number(page))

    
    const dbFilter = {
      isDeleted: false,
      isBlocked: { $ne: true },
    }
    if (search)   dbFilter.productName = { $regex: search, $options: "i" }
    if (category) dbFilter.category    = category
    if (brand)    dbFilter.brand       = brand

    const raw = await Product.find(dbFilter)
      .populate({ path: "category", match: { isListed: true, isDeleted: false } })
      .populate({ path: "brand",    match: { isListed: true, isDeleted: false } })
      .lean()

   
    const minP = minPrice ? Number(minPrice) : null
    const maxP = maxPrice ? Number(maxPrice) : null

    const withVariant = raw.reduce((acc, product) => {
     
      if (!product.category || !product.brand) return acc

      const match = product.variants
        .filter(v => {
          if (v.status !== "ACTIVE" || v.stock <= 0) return false
          if (size && v.size !== size)               return false
          if (minP  && v.price < minP)               return false
          if (maxP  && v.price > maxP)               return false
          return true
        })
        
        .sort((a, b) => a.price - b.price)[0]

      if (match) acc.push({ product, variant: match })
      return acc
    }, [])

   
    withVariant.sort((a, b) => {
      switch (sort) {
        case "low-high":  return a.variant.price - b.variant.price
        case "high-low":  return b.variant.price - a.variant.price
        case "a-z":       return a.product.productName.localeCompare(b.product.productName)
        case "z-a":       return b.product.productName.localeCompare(a.product.productName)
        default:          return new Date(b.product.createdAt) - new Date(a.product.createdAt)
      }
    })

    
    const totalPages = Math.ceil(withVariant.length / limit)
    const safePage   = Math.min(currentPage, Math.max(1, totalPages))
    const skip       = (safePage - 1) * limit
    const pageItems  = withVariant.slice(skip, skip + limit)

    
    const products = pageItems.map(({ product, variant }) => ({
      ...product,
      _activeVariant: variant,   
    }))

    
    const [categories, brands] = await Promise.all([
      Category.find({ isListed: true, isDeleted: false }),
      Brand.find({    isListed: true, isDeleted: false }),
    ])

    
    let wishlistedProductIds = []
    const userId = req.session?.user
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId }).lean()
      if (wishlist?.products?.length) {
        wishlistedProductIds = [
          ...new Set(wishlist.products.map(i => i.productId.toString()))
        ]
      }
    }

    
    res.render("user/product/productCategory", {
      products,
      categories,
      brands,
      currentPage: safePage,
      totalPages,
      search,
      category,
      brand,
      size,
      minPrice,
      maxPrice,
      sort,
      wishlistedProductIds,
    })

  } catch (error) {
    console.error("[loadShop]", error)
    res.redirect("/pageNotFound")
  }
}