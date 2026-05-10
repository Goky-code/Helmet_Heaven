import express from "express";

const router = express.Router();

import {
  loadBrand,
  addBrand,
  editBrand,
  deleteBrand,
} from "../controllers/brandControllers.js"

router.get("/brands",loadBrand);

router.post("/add-brand",addBrand);

router.post("/edit-brand/:id",editBrand);

router.get("/delete-brand/:id",deleteBrand);

export default router;