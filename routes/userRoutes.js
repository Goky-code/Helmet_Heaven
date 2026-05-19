import express from "express";
import upload from "../middlewares/multer.js";
import * as userController from "../controllers/userController.js";
import { nocache, isUserAuth, preventUserLogin } from "../middlewares/userAuth.js"; 
import authMiddleware from "../middlewares/authMiddleware.js";

const router  = express.Router();
 


router.get('/login',nocache,preventUserLogin,userController.getLogin)
router.get('/signup',nocache,preventUserLogin,userController.getsignup);
router.get('/homepage',userController.getHome)
router.get('/logout',userController.logout)
router.get('/verifyOtp',nocache,preventUserLogin,userController.getOtp)
router.get('/forgotPassword',userController.getforgotPassword)
// router.get('/verifyForgotOtp',userController.getVerifyforgotOtp)
router.get('/resetPassword',userController.getresetPassword)
router.get("/profileinformation",nocache,isUserAuth,userController.getProfile);
router.post("/profileinformation", userController.updateProfile);
router.post("/profile", upload.single("profileImage"), userController.updateProfile);


router.get("/address/addressPage", userController.getAddresses)

router.get("/addNewaddress", userController.getAddAddress);
router.post("/addNewaddress", userController.addAddress);

router.get("/editAddress/:id", userController.getEditAddress);
router.post("/editAddress/:id", userController.updateAddress);

router.get("/deleteAddress/:id", userController.deleteAddress);
router.get("/setdefault/:id", userController.setDefaultAddress);

router.post("/send-email-otp",userController.sendEmailOTP);
router.get("/editEmailotp", userController.loadOTPPage);
router.post("/editEmailotp",userController.verifyEmailOTP);

router.post("/resendEmailOtp",userController. resendEmailOTP);

router.get('/passwordChange',userController.passwordchange)
router.post('/change-password',userController.changePassword);

export default router