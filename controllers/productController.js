  
 import * as productService from "../services/admin/productService.js"

export const loadProducts = async (req, res) => {
  try {
    const data=await productService.getProducts(req.query)

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
    res.render("admin/adminProduct/add-product",data);
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

export const addProduct = async (req, res) => {
  try {
    await productService.createProduct(req.body,req.files)
    res.status(200).json({
      success:true,
      message:"Product added successfully",
      redirectUrl:'/admin/products',
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
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
    res.status(200).json({
      success:true,
      message:"Product updated Successfully",
      redirectUrl:"/admin/products",
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {

   await productService.removeProduct(req.params.id)
   res.status(200).json({
    success:true,
    message:"product deleted successfully"
   })

  } catch (error) {

    console.log(error);

    res.status(500).json({
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
    res.json({
      success:true,
      message:"Variant added Successfully",
      variants,
    })

  } catch (error) {

    console.log(error)

    res.json({
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
   res.json({
      success: true,
      message: "Variant deleted",
    })


  } catch (error) {

    console.log(error)

    res.json({
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

    res.json({
      success:true,
      message:"variant updated",
      variant,
    })
  } catch (error) {
    console.log(error);
    res.json({ success: false,
       message: error.message });
  }
};



