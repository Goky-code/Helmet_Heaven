import express from "express";
import upload from "../middlewares/multer.js";
import * as userController from "../controllers/userController.js";
import { nocache, isUserAuth, preventUserLogin } from "../middlewares/userAuth.js"; 
import authMiddleware from "../middlewares/authMiddleware.js";
import { addToCart,loadCart , updateCartQuantity, removeCartItem  } from "../controllers/user/cartController.js";
import {loadProductDetails} from "../controllers/user/productdetailsController.js"

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
// Replace the existing /profile POST route with this:
router.post("/profile", (req, res, next) => {
  upload.single("profileImage")(req, res, (err) => {
    if (err) {
      // Multer/fileFilter rejection lands here
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, userController.updateProfile);

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

router.get("/cart", isUserAuth, loadCart);

router.post("/add-to-cart/:id", isUserAuth, addToCart);
router.get("/product/:id", loadProductDetails)

router.post("/update-cart", isUserAuth, updateCartQuantity);
router.post("/remove-cart-item", isUserAuth, removeCartItem);

export default router