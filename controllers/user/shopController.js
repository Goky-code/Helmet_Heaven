import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Brand from "../../models/brandModels.js"

export const loadShop = async (req, res) => {
  try {
    const {
      search = "", 
      category = "", 
      brand = "",
      size = "", 
      minPrice = "", 
      maxPrice = "",
      sort = "", 
      page = 1
    } = req.query

    const limit       = 6
    const currentPage = Number(page)
    const skip        = (currentPage - 1) * limit

    let filter = {
      isDeleted: false,
      isBlocked:{ $ne: true }    
    }

    if (search)   filter.productName       = { $regex: search, $options: "i" }
    if (category) filter.category          = category
    if (brand)    filter.brand             = brand
    if (size)     filter["variants.size"]  = size

    if (minPrice || maxPrice) {
      filter["variants.price"] = {}
      if (minPrice) filter["variants.price"].$gte = Number(minPrice)
      if (maxPrice) filter["variants.price"].$lte = Number(maxPrice)
    }

    let sortOption = {}
    switch (sort) {
      case "low-high": sortOption = { "variants.price": 1  }; break
      case "high-low": sortOption = { "variants.price": -1 }; break
      case "a-z":      sortOption = { productName: 1       }; break
      case "z-a":      sortOption = { productName: -1      }; break
      default:         sortOption = { createdAt: -1        }
    }

   
    const allProducts = await Product.find(filter)
      .populate({ path: "category", match: { isListed: true, isDeleted: false } })
      .populate({ path: "brand",    match: { isListed: true, isDeleted: false } })
      .sort(sortOption)
      

    const allValidProducts = allProducts.filter(product => {
      if (!product.category || !product.brand) return false

      return product.variants.some(v =>
        v.status === "ACTIVE" &&
        v.stock > 0 &&
        (!size     || v.size  === size) &&
        (!minPrice || v.price >= Number(minPrice)) &&
        (!maxPrice || v.price <= Number(maxPrice))
      )
    })

    const totalPages    = Math.ceil(allValidProducts.length / limit)
    const validProducts = allValidProducts.slice(skip, skip + limit)

    const categories = await Category.find({ isListed: true, isDeleted: false })
    const brands     = await Brand.find({    isListed: true, isDeleted: false })

    res.render("user/product/productCategory", {
      products: validProducts,
      categories,
       brands,
      currentPage, 
      totalPages,
      search,
       category,
        brand,
      size, 
      minPrice, 
      maxPrice, 
      sort
    })

  } catch (error) {
    console.log(error)
    res.redirect("/pageNotFound")
  }
}