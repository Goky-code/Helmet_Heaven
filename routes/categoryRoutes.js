
import express from "express";
import {
  loadCategory,loadAddCategory,loadEditCategory,
  addCategory,
  editCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/categories", loadCategory);

router.get("/add-category",loadAddCategory)

router.post("/add-category", addCategory);

router.get("/edit-category/:id",loadEditCategory)

router.post("/edit-category/:id", editCategory);

router.get("/delete-category/:id", deleteCategory);

router.get("/toggle-category/:id", toggleCategoryStatus);

export default router;