  
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