
import Category from "../models/categoryModel.js";
import * as categoryService from "../services/admin/categoryService.js"
import HTTP_STATUS from "../utils/httpStatus.js";

export const loadCategory = async (req, res) => {
  try {
      const search=req.query.search || ""
     const page= parseInt(req.query.page) || 1
     const limit=4
     const sort=req.query.sort||""
      
     const data=await categoryService.getCategories(
      search,page,limit,sort
     )
     res.render("admin/admincategory/adminCategory",data)
    }catch(error){
      console.log(error)
      res.redirect("admin/pageerror")
    }
  }


export const loadAddCategory=async(req,res)=>{
  try{
    res.render("admin/admincategory/add-category")
  }catch(error){
    console.log(error)
    res.redirect("/admin/pageerror")
  }
}

export const addCategory = async (req, res) => {
  try {

    await categoryService.createCategory(req.body)

    res.status(HTTP_STATUS.CREATED).json({
      success:true,
      message:"Category added successfully"
    })
    }catch(error){
      console.log(error)
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success:false,
        message:error.message,
        
      })
    }
    }

export const loadEditCategory=async(req,res)=>{
  try{
   
    const category=await categoryService.getCategoryById(req.params.id)

    if(!category){
      return res.redirect("/admin/categories")
    }
    res.render("admin/admincategory/edit-category",{
      category,
    })

    }catch(error){
      console.log(error)
      res.redirect("/admin/pageerror")
    }
}

export const editCategory = async (req, res) => {
  try {
   
    await categoryService.updateCategory(
      req.params.id,
      req.body
    )
    res.status(HTTP_STATUS.CREATED).json({
      success:true,
      message:"Category updated successfully",
    })
  }catch(error){
    console.log(error)
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success:false,
      message:error.message,
    })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    
    await categoryService.removeCategory(req.params.id)
    res.redirect('/admin/categories')
}catch(error){
  console.log(error)
  res.redirect("/admin/pageerror")
}
}


export const toggleCategoryStatus = async (req, res) => {
  try {
  
    await categoryService.toggleCategoryStatus(req.params.id)
    res.redirect("/admin/categories")
  }catch(error){
    console.log(error)
    res.redirect("/admin/pageerror")
  }
};