import Brand from "../models/brandModels.js";
import {
  getBrands,
  createBrand,
  getBrandById,
  updateBrand,
  removeBrand,
} from "../services/admin/brandService.js";

export const loadBrand = async (req, res) => {
  try {

    const search = req.query.search || "";

    const page = parseInt(req.query.page) || 1;

    const limit=4

    const data=await getBrands(search,page,limit)
      res.render("admin/adminbrand/adminBrand",data)
    
  } catch (error) {

    console.log(error);

    res.redirect("/admin/pageerror");
  }
};


export const loadAddBrand=async(req,res)=>{
  try{
    res.render("admin/adminbrand/add-brand")
  }catch(error){
    console.log(error)
    res.redirect("admin/pageerror")
  }
}

export const addBrand = async (req, res) => {
  try {
     await createBrand(req.body)
     res.json({
      success:true,
      message:"Brand added Successfully"
     })
}catch(error){
  console.log(error)
  res.status(400).json({
    success:false,
    message:error.message,
  })
}
}

export const loadEditBrand=async(req,res)=>{
  try{
    const brand=await Brand.findById(req.params.id)
    if(!brand){
       return res.redirect("admin/brands")
    }
    res.render("admin/adminbrand/edit-brand",{brand})
    }catch(error){
      console.log(error)
      res.redirect("admin/pageerror")
    }
    }

export const editBrand = async (req, res) => {
  try {
     await updateBrand(req.params.id,req.body)
     res.json({
      success:true,
      message:"Brand Updated Successfully"
     })
   
  } catch (error) {
    console.log(error)
    
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBrand = async (req, res) => {
  try {

   await removeBrand(req.params.id)
    res.redirect("/admin/brands");

  } catch (error) {
    console.log(error);
     res.redirect("/admin/pageerror");
  }
};

export const toggleBrandStatus=async(req,res)=>{
  try{
    await toggleBrandStatus(req.params.id)
     res.redirect("/admin/brands")
  }catch(error){
    console.log(error)
    res.redirect("/admin/pageerror")
  }
}