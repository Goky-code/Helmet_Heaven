import Product from "../../models/productModel";
import Category from "../../models/categoryModel"

export const getInventory=async(page,limit,search,status,category)=>{
    const skip=(page-1)*limit

    const filter={
        isDeleted:false
    }

    if(search){
        filter.productName={
            $regex:search,
            $option:"i"
        }
    }
    if(category){
        filter.category=category
    }
    const products=await Product.find(filter)
    .populate("brand","name")
    .populate("category","name")
    .lean()

    const inventoryRows=[]
  products.forEach(product=>{
    product.variants.forEach(variant=>{
        let statusKey
        if(variant.stock===0){
            statusKey="OUT"
        }else if(variant.stock<=5){
            statusKey="LOW"
        }else{
            statusKey="OK"
        }
        if(status&&status!==statusKey){
            return
        }
        inventoryRows.push({
            product,variant
        })
    })
  })

  const totalItems=inventoryRows.length
  const totalPages=Math.ceil(totalItems/limit)
  const paginatedRows=inventoryRows.slice(skip,skip+limit)

  const paginatedProducts=[]
  paginatedRows.forEach(row=>{
     let product=paginatedProducts.find(item=>item._id.toString()===row.product._id.toString())

     if(!product){
        product={
            ...row.product,variants:[]
        }
        paginatedProducts.push(product)
     }
     product.variants.push(row.variant)
  })
  const categories=await Category.find({
    isDeleted:false
  }).lean()
  return{
    products:paginatedProducts,
    categories,
    currentPage:page,
    totalPages,
    search,
    selectedStatus:status,
    category
  }
}

export const updateVariantStock=async(
    productId,variantId,stock
)=>{
    const product=await Product.findOne({
        _id:productId,
        isDeleted:false
    })
    if(!product){
        throw new Error("Product not found")
    }
    const variant=product.variants.id(variantId)

    if(!variant){
        throw new Error("Variant not found")
    }

    variant.stock=stock
    await product.save()

    return  variant
}