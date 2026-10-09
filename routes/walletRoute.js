import express from "express";
import { loadWallet,loadAddMoneyPage,createWalletTopUpOrder,verifyWalletTopUp, loadTopUpSuccessPage } from "../controllers/user/walletController.js"

const router=express.Router()

router.get("/wallet",loadWallet)
router.get("/wallet/addMoney",loadAddMoneyPage)
router.post("/wallet/create-topup-order",createWalletTopUpOrder)
router.post("/wallet/verify-topup",verifyWalletTopUp)
router.get("/wallet/topup-success",loadTopUpSuccessPage)

export default router