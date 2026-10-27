import express from "express"

import {
  loadShop
} from "../controllers/user/shopController.js"

const router = express.Router()

router.get("/shop", loadShop)

export default router