import express from "express";
import { loadWallet } from "../controllers/user/walletController.js"

const router=express.Router()

router.get("/wallet",loadWallet)

export default router