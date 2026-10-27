import express from "express";

import {
  loadBrand,loadAddBrand,loadEditBrand,
  addBrand,
  editBrand,
  deleteBrand,
  toggleBrandStatus,
} from "../controllers/brandControllers.js"

const router = express.Router();

router.get("/brands",loadBrand);
router.get("/add-brand",loadAddBrand)
router.post("/add-brand",addBrand);
router.get("/edit-brand/:id",loadEditBrand)
router.post("/edit-brand/:id",editBrand);

router.get("/delete-brand/:id",deleteBrand);

router.get("/toggle-category/:id", toggleBrandStatus);
export default router;