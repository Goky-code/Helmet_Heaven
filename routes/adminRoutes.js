import express from "express"
import * as adminController from "../controllers/adminController.js"
 import {noCache,preventLogin} from "../middlewares/adminAuth.js"
import { isAdminAuth } from "../middlewares/isadminLogin"
const router=express.Router()

router.get('/adminLogin',noCache,preventLogin,adminController.getLogin)

router.post("/adminLogin", adminController.login);

router.get("/logout", adminController.logout);


router.get("/adminDashboard", adminController.getDashboard);

router.get('/adminCustomer',isAdminAuth,adminController.listCustomers)

router.post('/blockCustomer/:id',adminController.toggleBlockCustomer)

export default router;