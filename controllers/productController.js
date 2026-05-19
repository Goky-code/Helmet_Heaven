  
import Product from "../models/productModel.js";
import Brand from "../models/brandModels.js"
import Category from "../models/categoryModel.js";
import sharp from "sharp"
import fs from "fs"
import path from "path"
 
export const loadProducts = async (req, res) => {
  try {

    const products = await Product
      .find({ isDeleted: false })
      .populate("brand")
      .populate("category");

    const brands = await Brand.find({
      isDeleted: false,
      isListed: true
    });

    const categories = await Category.find({
      isDeleted: false,
      isListed: true
    });

    res.render("admin/adminProducts", {
      products,
      brands,
      categories
    });

  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};
export const loadAddProduct = async (req, res) => {
  try {
    const brands = await Brand.find({ isDeleted: false });
    const categories = await Category.find({ isDeleted: false });
    res.render("admin/add-product", { brands, categories });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

export const addProduct = async (req, res) => {
  try {
    const { productName, brand, category, description } = req.body;

    const images = req.files.map(file => file.path);

    const product = new Product({
      productName,
      brand,
      category,
      description,
      productImage: images,
    });

    await product.save();

    // ✅ Return JSON so the frontend fetch() can parse it
    return res.status(200).json({
      success: true,
      message: "Product added successfully!",
      redirectUrl: "/admin/products",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding product.",
    });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.productName  = req.body.productName;
    product.brand        = req.body.brand;
    product.category     = req.body.category;
    product.description  = req.body.description;

    // ✅ Guard against undefined req.files before checking length
    if (req.files && req.files.length > 0) {
      let newImages = [];
      for (let file of req.files) {
        const resizedImage = `resized-${file.filename}`;
        await sharp(file.path)
          .resize(800, 800)
          .toFile(path.join("public/uploads/products", resizedImage));
        fs.unlinkSync(file.path);
        newImages.push(resizedImage);
      }
      product.productImage = [...product.productImage, ...newImages];
    }

    await product.save();

    // ✅ Always send a JSON response
    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      redirectUrl: "/admin/products",
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating product.",
    });
  }
};



export const loadEditProduct = async (req, res) => {

  try {

    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {

      return res.redirect("/admin/products");
    }

    res.render("admin/edit-product", {
      product
    });

  } catch (error) {

    console.log(error);

    res.redirect("/admin/pageerror");
  }
};

export const deleteProduct = async (req, res) => {

  try {

    const { id } = req.params;

    await Product.findByIdAndUpdate(id, {
      isDeleted: true
    });

    res.json({
      success: true
    });

  } catch (error) {

    res.json({
      success: false
    });
  }
};