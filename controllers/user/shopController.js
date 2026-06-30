import Product  from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Brand    from "../../models/brandModels.js"
import Wishlist from "../../models/wishlistModel.js"
import Cart from "../../models/cartModel.js"

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
     
    }
    if (search)  
       dbFilter.productName = { $regex: search, $options: "i" }

    if (category)
       dbFilter.category    = category

    if (brand)  
        dbFilter.brand       = brand

    const raw = await Product.find(dbFilter)
      .populate({ path: "category", match: { isListed: true, isDeleted: false } })
      .populate({ path: "brand",    match: { isListed: true, isDeleted: false } })
      .lean()

   
    const minP = minPrice ? Number(minPrice) : null
    const maxP = maxPrice ? Number(maxPrice) : null

 const withVariant = raw.reduce((acc, product) => {
  if (!product.category || !product.brand) return acc

  const isUnavailable=!!product.isBlocked

  const activeVariants = product.variants.filter(v => {
    if (v.status !== "ACTIVE") return false
    if (size && v.size !== size) return false
    if (minP && v.price < minP) return false
    if (maxP && v.price > maxP) return false
    return true
  })

  if (activeVariants.length === 0) return acc  
  
  const inStock    = activeVariants.filter(v => v.stock > 0)
  const candidates = inStock.length > 0 ? inStock : activeVariants

  const match = candidates.sort((a, b) => a.price - b.price)[0]

  acc.push({ product, variant: match,isUnavailable })
  return acc
}, [])

   
    withVariant.sort((a, b) => {
      switch (sort) {
        case "low-high": 
         return a.variant.price - b.variant.price

        case "high-low": 
         return b.variant.price - a.variant.price

        case "a-z":    
           return a.product.productName.localeCompare(b.product.productName)

        case "z-a":  
             return b.product.productName.localeCompare(a.product.productName)

        default:  
              return new Date(b.product.createdAt) - new Date(a.product.createdAt)
      }
    })

    
    const totalPages = Math.ceil(withVariant.length / limit)
    const safePage   = Math.min(currentPage, Math.max(1, totalPages))
    const skip       = (safePage - 1) * limit
    const pageItems  = withVariant.slice(skip, skip + limit)

    
    const products = pageItems.map(({ product, variant,isUnavailable }) => ({
      ...product,
      _activeVariant: variant,  
      _isUnavailable:isUnavailable, 
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