import express from "express";

const router = express.Router();

import {
  loadBrand,loadAddBrand,loadEditBrand,
  addBrand,
  editBrand,
  deleteBrand,
} from "../controllers/brandControllers.js"

router.get("/brands",loadBrand);
router.get("/add-brand",loadAddBrand)
router.post("/add-brand",addBrand);
router.get("/edit-brand/:id",loadEditBrand)
router.post("/edit-brand/:id",editBrand);

router.get("/delete-brand/:id",deleteBrand);

export default router;