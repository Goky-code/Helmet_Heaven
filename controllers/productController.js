  
 import * as productService from "../services/admin/productService.js"
 import Category from "../models/categoryModel.js";
 import Brand from "../models/brandModels.js";
 import HTTP_STATUS from "../utils/httpStatus.js";

export const loadProducts = async (req, res) => {
  try {
     const {search,category,brand,status}=req.query
    const page=parseInt(req.query.page)||1
    const limit=6
    const data=await productService.getProducts(page,limit ,{search,category,brand,status})

    if(req.headers["x-requested-with"]==="XMLHttpRequest"){
      return res.json({
        success:true,
        products:data.products,
      })
    }
    res.render("admin/adminProduct/adminProducts",data)
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

export const loadAddProduct = async (req, res) => {
  try {
   const data=await productService.getAddProductData()
   const categories=await Category.find({
    isListed:true,
    isDeleted:false
   })
   const brands=await Brand.find({
    isListed:true,
    isDeleted:false
   })
    res.render("admin/adminProduct/add-product",{data,categories,brands,});
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

export const addProduct = async (req, res) => {
  try {
    await productService.createProduct(req.body,req.files)
    res.status(HTTP_STATUS.CREATED).json({
      success:true,
      message:"Product added successfully",
      redirectUrl:'/admin/products',
    })
  } catch (error) {
    console.log(error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

export const loadEditProduct = async (req, res) => {

  try {

    const data=await productService.getEditProductData(req.params.id)
    res.render("admin/adminProduct/edit-product",data)

  } catch (error) {

    console.log(error);

    res.redirect("/admin/pageerror");
  }
};

export const editProduct = async (req, res) => {
  try {
   await productService.updateProduct(
    req.params.id,
    req.body,
    req.files
   )
    res.status(HTTP_STATUS.CREATED).json({
      success:true,
      message:"Product updated Successfully",
      redirectUrl:"/admin/products",
    })

  } catch (error) {
    console.log(error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {

   await productService.removeProduct(req.params.id)
   res.status(HTTP_STATUS.OK).json({
    success:true,
    message:"product deleted successfully"
   })

  } catch (error) {

    console.log(error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });

  }
};

export const getVariants = async (req, res) => {
  try {

    const variants=await productService.getVariants(req.params.id)

    res.json({
      success: true,
      variants,
    })

  } catch (error) {

    console.log(error)

    res.json({
      success: false,
      message:error.message,
    })
  }
}

export const addVariant = async (req, res) => {

  try {
     
    const variants=await productService.createVariant(
      req.params.id,req.body
    )
    res.status(HTTP_STATUS.OK).json({
      success:true,
      message:"Variant added Successfully",
      variants,
    })

  } catch (error) {

    console.log(error)

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    })
  }
}

export const deleteVariant = async (req, res) => {

  try {

   await productService.removeVariant(
    req.params.productId,
    req.params.variantId
   )
   res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Variant deleted",
    })


  } catch (error) {

    console.log(error)

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message:error.message,
    })
  }
}

export const changeVariantStatus = async (req, res) => {

  try {

   const status=await productService.changeVariantStatus(
    req.params.productId,
    req.params.variantId
   )
    res.json({
      success: true,
      status,
    })

  } catch (error) {

    console.log(error)

    res.json({
      success: false,
      message:error.message,
    })
  }
}

export const updateVariant = async (req, res) => {
  try {
    const variant=await productService.updateVariant(
      req.params.productId,req.params.variantId,req.body
    )

    res.status(HTTP_STATUS.OK).json({
      success:true,
      message:"variant updated",
      variant,
    })
  } catch (error) {
    console.log(error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false,
       message: error.message });
  }
};



