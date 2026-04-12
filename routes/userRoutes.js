import express from "express";
import * as userController from "../controllers/userController.js";
 const router  = express.Router();
 


router.get('/login',userController.getLogin)
router.get('/signup',userController.getsignup);
router.get('/homepage',userController.getHome)
router.get('/logout',userController.logout)
router.get('/verifyOtp',userController.getOtp)


export default router