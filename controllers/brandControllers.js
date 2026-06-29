import Brand from "../models/brandModels.js";




export const loadBrand = async (req, res) => {
  try {

    const search = req.query.search || "";

    const page = parseInt(req.query.page) || 1;

    const limit = 4;

    const skip = (page - 1) * limit;

    const searchQuery = {
      isDeleted: false,
      name: { $regex: search, $options: "i" },
    };

    const totalBrands =
      await Brand.countDocuments(searchQuery);

    const totalPages =
      Math.ceil(totalBrands / limit);

    const brands = await Brand.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/adminbrand/adminBrand", {
      brands,
      currentPage: page,
      totalPages,
      totalBrands,
      search,
      limit,
    });

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

    const { name, description, isListed } = req.body;

    const existingBrand = await Brand.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
      isDeleted: false,
    });

    if (existingBrand) {
      return res.json({
        success: false,
        message: "Brand already exists",
      });
    }

    const newBrand = new Brand({
      name,
      description,
      isListed,
    });

    await newBrand.save();

    res.json({
      success: true,
    });

  } catch (error) {
    console.log(error);
  }
};

export const loadEditBrand=async(req,res)=>{
  try{
    const {id}=req.params
    const brand=await Brand.findById(id)

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

    const { id } = req.params;

    const { name, description, isListed } = req.body;
    console.log(req.body);

    await Brand.findByIdAndUpdate(id, {
      name,
      description,
      isListed,
    });

   return res.json({
      success: true,
    });

  } catch (error) {
    console.log(error)
    
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const deleteBrand = async (req, res) => {
  try {

    const { id } = req.params;

    await Brand.findByIdAndUpdate(id, {
      isDeleted: true,
    });

    res.redirect("/admin/brands");

  } catch (error) {
    console.log(error);
  }
};