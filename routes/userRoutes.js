import express from "express";
import upload from "../middlewares/multer.js";
import * as userController from "../controllers/userController.js";
import { nocache, isUserAuth, preventUserLogin } from "../middlewares/userAuth.js"; 
import authMiddleware from "../middlewares/authMiddleware.js";
import { addToCart,loadCart , updateCartQuantity, removeCartItem  } from "../controllers/user/cartController.js";
import {loadProductDetails} from "../controllers/user/productdetailsController.js"
import {
  getCartCount
} from "../controllers/user/cartController.js";

import {
  getWishlistCount
} from "../controllers/user/wishlistController.js";


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

router.post("/profile", (req, res, next) => {
  upload.single("profileImage")(req, res, (err) => {
    if (err) {
     
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, userController.updateProfile);

router.get("/address/addressPage",isUserAuth, userController.getAddresses)

router.get("/addNewaddress",isUserAuth, userController.getAddAddress);
router.post("/addNewaddress",isUserAuth, userController.addAddress);

router.get("/editAddress/:id",isUserAuth, userController.getEditAddress);
router.post("/editAddress/:id", isUserAuth,userController.updateAddress);

router.get("/deleteAddress/:id",isUserAuth, userController.deleteAddress);
router.get("/setdefault/:id",isUserAuth, userController.setDefaultAddress);

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

router.get("/cart/count", isUserAuth, getCartCount);
router.get("/wishlist/count", isUserAuth, getWishlistCount);

export default router