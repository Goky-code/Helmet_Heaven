import Product from "../../models/productModel.js";
import Brand from "../../models/brandModels.js";
import Category from "../../models/categoryModel.js";

export const getProducts=async(page,limit,{search="",category="",brand="",status=""})=>{

    const skip=(page-1)*limit
    const filter={isDeleted:false}

    if(search){
        filter.productName={$regex:search,$options:"i"}
    }
    if(status==="ACTIVE")
        filter.isBlocked=false
    if(status==="INACTIVE")
        filter.isBlocked=true

   
    if(brand){
        filter.brand=brand
        
    }

    if(category){
        filter.category=category
          
       
    }
    const brands=await Brand.find({
        isDeleted:false,
        isListed:true,
    })
    const categories=await Category.find({
        isDeleted:false,
        isListed:true,
    })

    const totalProducts=await Product.countDocuments(filter)
    const totalPages=Math.ceil(totalProducts/limit)

     const products=await Product.find(filter)
    .populate("brand")
    .populate("category")
     .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
   

    return{
        products,
        brands,
        categories,
        currentPage:page,
        totalProducts,
        totalPages,
        search,
        category,
         brand,
         status,
        page,
        limit
    }
}

export const getAddProductData=async()=>{
    const brands=await Brand.find({
        isDeleted:false,
    })
    const categories=await Category.find({
        isDeleted:false,
    })
    return{
        brands,
        categories,
    }
}

export const createProduct=async(body,files)=>{
    const{
        productName,brand,category,description,}=body
        const images=files.map(file=>file.path)

        const product=new Product({
            productName,
            brand,
            category,
            description,
            productImage:images,
            variants:[],
        })
        await product.save()

        return product
    }

export const getEditProductData=async(id)=>{
    const product=await Product.findById(id)
    .populate("brand")
    .populate("category")

  
    if(!product){
        throw new Error("Product not found")
    }
    const brands=await Brand.find({
        isDeleted:false,
        isListed:true,
    })

const categories=await Category.find({
    isDeleted:false,
    isListed:true,
})

return{
    product,
    brands,
    categories,
}
}

export const updateProduct=async(id,body,files)=>{
    const product=await Product.findById(id)

    if(!product){
        throw new Error("product not found")
    }
    product.productName=body.productName
    product.brand=body.brand
    product.category=body.category
    product.description=body.description

    if(body.status){
        product.isBlocked=body.status==="INACTIVE"
    }

    if((files&&files.length>0)||body.existingImages){
        const newImages=files?files.map(file=>file.path):[]

        let kept=body.existingImages||[]
        if(typeof kept==="string"){
            kept=[kept]
        }
        product.productImage=[
            ...kept,
            ...newImages,
        ]
    }
    await product.save()
    return product 
}

export const removeProduct=async(id)=>{
    const product=await Product.findByIdAndUpdate(id,
        {
            isDeleted:true,
        },
        {new:true,}
    )
    if(!product){
        throw new Error("Product not found")
    }
    return product
}

export const getVariants=async(productId)=>{
    const product=await Product.findById(productId)

if(!product){
    throw new Error("product not found")
}
return product.variants

}

export const createVariant=async(productId,{size,stock,price})=>{
    const product=await Product.findById(productId)
    
    if(!product){
        throw new Error("Product not found")
    }
    const existingVariant=product.variants.find(
        variants=>variants.size===size
    )
    if (existingVariant){
        throw new Error("Variant already exists")
    }

    product.variants.push({
        size,
        stock,
        price,
    })
    await product.save()
    return product.variants
}

export const removeVariant=async(productId,variantId)=>{
    const product=await Product.findById(productId)

    if(!product){
        throw new Error("Product not found")
    }
    product.variants=product.variants.filter(variant=>variant._id.toString()!==variantId)

    await product.save()
    return product.variants
}

export const changeVariantStatus=async(productId,variantId)=>{
    const product=await Product.findById(productId)

    if(!product){
        throw new Error("product not found")
    }
    const variant=product.variants.id(variantId)

    if(!variant){
        throw new Error("Variant not found")
    }

   variant.status=variant.status==="ACTIVE"?"INACTIVE":"ACTIVE"

   await product.save()

   return variant.status
}

export const updateVariant=async(productId,variantId,{size,stock,price})=>{
    const product=await Product.findById(productId)
      if(!product){
        throw new Error("Product not found")
      }
      const variant=product.variants.id(variantId)

      if(!variant){
        throw new Error("Variant not found")
      }
      const duplicate=product.variants.find(
        item=>item.size===size&&item._id.toString()!==variantId
      )
      if(duplicate){
        throw new Error("Variant already exists")
      }
      variant.size=size
      variant.stock=stock
      variant.price=price

      await product.save()

      return product.variants
}