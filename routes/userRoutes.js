import express from "express";
import upload from "../middlewares/upload.js";

import * as userController from "../controllers/userController.js";
 const router  = express.Router();
 


router.get('/login',userController.getLogin)
router.get('/signup',userController.getsignup);
router.get('/homepage',userController.getHome)
router.get('/logout',userController.logout)
router.get('/verifyOtp',userController.getOtp)
router.get('/forgotPassword',userController.getforgotPassword)
router.get('/verifyforgotOtp',userController.getVerifyforgotOtp)
router.get('/resetPassword',userController.getresetPassword)
router.get("/profileinformation", userController.getProfile);
router.post("/profileinformation", userController.updateProfile);
router.post("/profile", upload.single("profileImage"), userController.updateProfile);


router.get("/addressPage", userController.getAddresses)

router.get("/addNewaddress", userController.getAddAddress);
router.post("/addNewaddress", userController.addAddress);

router.get("/editAddress/:id", userController.getEditAddress);
router.post("/editAddress/:id", userController.updateAddress);

router.get("/deleteAddress/:id", userController.deleteAddress);
router.get("/setdefault/:id", userController.setDefaultAddress);





export default router