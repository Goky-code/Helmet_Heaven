  
import Product from "../models/productModel.js";
import Brand from "../models/brandModels.js"
import Category from "../models/categoryModel.js";
import sharp from "sharp"
import fs from "fs"
import path from "path"
import { skipMiddlewareFunction } from "mongoose";
 
export const loadProducts = async (req, res) => {
  try {
    const { search = "", category = "", brand = "", status = "" } = req.query;

    
    const filter = { isDeleted: false };

    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    if (status === "ACTIVE")   filter.isBlocked = false;
    if (status === "INACTIVE") filter.isBlocked = true;

    
    let query =  Product.find(filter).populate("brand").populate("category").sort({ createdAt:-1 })

    let products = await query;

   
    if (brand)    products = products.filter(p => p.brand?.name === brand);
    if (category) products = products.filter(p => p.category?.name === category);

    const brands = await Brand.find({ isDeleted: false, isListed: true });
    const categories = await Category.find({ isDeleted: false, isListed: true });

    
    if (req.headers["x-requested-with"] === "XMLHttpRequest") {
      return res.json({ success: true, products });
    }

    res.render("admin/adminProducts", { products, brands, categories });

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
    console.log(images)
console.log(req.files)
    const product = new Product({
      productName,
      brand,
      category,
      description,
      productImage: images,
      variants:[]
    });

    await product.save();

  
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

     if (req.body.status) {
      product.isBlocked = req.body.status === "INACTIVE";
    }
   
    if (req.files && req.files.length > 0 || req.body.existingImages) {
  const newImages = req.files ? req.files.map(f => f.path) : [];
  
  let kept = req.body.existingImages || [];
  if (typeof kept === "string") kept = [kept];
  
  product.productImage = [...kept, ...newImages];
}
    await product.save();

    
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

    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};

export const getVariants = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.json({
        success: false
      })
    }

    res.json({
      success: true,
      variants: product.variants
    })

  } catch (error) {

    console.log(error)

    res.json({
      success: false
    })
  }
}

export const addVariant = async (req, res) => {

  try {

    const { size, stock, price } = req.body

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.json({
        success: false,
        message: "Product not found"
      })
    }

   
    const existingVariant = product.variants.find(
      variant => variant.size === size
    )

    if (existingVariant) {
      return res.json({
        success: false,
        message: "Variant already exists"
      })
    }

    product.variants.push({
      size,
      stock,
      price
    })

    await product.save()

    res.json({
      success: true,
      message: "Variant added successfully",
      variants: product.variants
    })

  } catch (error) {

    console.log(error)

    res.json({
      success: false,
      message: "Server error"
    })
  }
}

export const deleteVariant = async (req, res) => {

  try {

    const { productId, variantId } = req.params

    const product = await Product.findById(productId)

    if (!product) {
      return res.json({
        success: false
      })
    }

    product.variants = product.variants.filter(
      variant => variant._id.toString() !== variantId
    )

    await product.save()

    res.json({
      success: true,
      message: "Variant deleted"
    })

  } catch (error) {

    console.log(error)

    res.json({
      success: false
    })
  }
}

export const changeVariantStatus = async (req, res) => {

  try {

    const { productId, variantId } = req.params

    const product = await Product.findById(productId)

    const variant = product.variants.id(variantId)

    if (!variant) {
      return res.json({
        success: false
      })
    }

    variant.status =
      variant.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE"

    await product.save()

    res.json({
      success: true,
      status: variant.status
    })

  } catch (error) {

    console.log(error)

    res.json({
      success: false
    })
  }
}

export const updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { size, stock, price } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.json({ success: false, message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.json({ success: false, message: "Variant not found" });

    const duplicate = product.variants.find(
      v => v.size === size && v._id.toString() !== variantId
    );
    if (duplicate) return res.json({ success: false, message: "A variant with this size already exists" });

    variant.size  = size;
    variant.stock = stock;
    variant.price = price;

    await product.save();
    res.json({ success: true, message: "Variant updated", variants: product.variants });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error" });
  }
};



