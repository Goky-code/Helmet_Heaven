
import Category from "../models/categoryModel.js";

export const loadCategory = async (req, res) => {
  try {

    // SEARCH
    const search = req.query.search || "";

    // PAGINATION
    const page = parseInt(req.query.page) || 1;
    const limit = 4;

    const skip = (page - 1) * limit;

    // SEARCH QUERY
    const searchQuery = {
      isDeleted: false,
      name: { $regex: search, $options: "i" },
    };

    // TOTAL COUNT
    const totalCategories = await Category.countDocuments(searchQuery);

    // TOTAL PAGES
    const totalPages = Math.ceil(totalCategories / limit);

    // CATEGORY DATA
    const categories = await Category.find(searchQuery)
      .sort({ createdAt: -1 }) // DESCENDING
      .skip(skip)
      .limit(limit);

    res.render("admin/adminCategory", {
      categories,
      currentPage: page,
      totalPages,
      totalCategories,
      search,
      limit,
    });

  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};

export const addCategory = async (req, res) => {
  try {

    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCategory = new Category({
      name: name.trim(),
    });

    await newCategory.save();

    res.status(200).json({
      success: true,
      message: "Category added successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const editCategory = async (req, res) => {
  try {

    const { id } = req.params;
    const { name } = req.body;

    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp("^" + name + "$", "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    await Category.findByIdAndUpdate(id, {
      name: name.trim(),
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {

    const { id } = req.params;

    await Category.findByIdAndUpdate(id, {
      isDeleted: true,
    });

    res.redirect("/admin/categories");

  } catch (error) {
    console.log(error);
  }
};


export const toggleCategoryStatus = async (req, res) => {
  try {

    const { id } = req.params;

    const category = await Category.findById(id);

    category.isListed = !category.isListed;

    await category.save();

    res.redirect("/admin/categories");

  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};