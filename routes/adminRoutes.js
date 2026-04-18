import express from "express"
import * as adminController from "../controllers/adminController.js"

const router=express.Router()

router.get('/adminLogin',adminController.getLogin)

router.post("/adminLogin", adminController.login);

router.get("/logout", adminController.logout);


router.get("/dashboard", adminController.getDashboard);

export default router;