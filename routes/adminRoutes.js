import express from "express"
import * as adminController from "../controllers/adminController.js"
 import {noCache,preventLogin,isAdminAuth } from "../middlewares/adminAuth.js"

const router=express.Router()

router.get('/adminLogin',noCache,preventLogin,adminController.getLogin)

router.post("/adminLogin",preventLogin, adminController.login);

router.get("/logout", adminController.logout);


router.get("/adminDashboard",noCache,isAdminAuth, adminController.getDashboard);

router.get('/adminCustomer',noCache,isAdminAuth,adminController.listCustomers)

router.post('/blockCustomer/:id',adminController.toggleBlockUser)

export default router;