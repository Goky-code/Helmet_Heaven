
import express from "express";
import {
  loadCategory,
  addCategory,
  editCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/categories", loadCategory);

router.post("/add-category", addCategory);

router.post("/edit-category/:id", editCategory);

router.get("/delete-category/:id", deleteCategory);

router.get("/toggle-category/:id", toggleCategoryStatus);

export default router;