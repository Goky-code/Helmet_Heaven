import express from "express"
import passport from "passport";
import * as authController from "../controllers/authControllers.js"
import {getforgotPassword,getVerifyforgotOtp} from '../controllers/userController.js'
import { isUserAuth } from "../middlewares/userAuth.js";

const router = express.Router();

router.post("/login",authController.login);
router.post("/signup", authController.signup);


router.post('/verifyOtp',authController.verifyOtp)
router.get('/resendOtp',authController.resendOtp)


router.get('/forgotPassword', getforgotPassword);
router.get('/verifyForgotpassOtp', getVerifyforgotOtp);
 router.get('/resendOtpforgot', authController.resendOtpforgot)

router.post('/forgotPassword',authController.forgotPassword)
router.post('/verifyForgotpassOtp',authController.verifyForgotOtp)



router.post('/resetPassword',authController.resetPassword)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email']
  // prompt: 'select_account'
 }));


router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  (req, res) => {
    req.session.user=req.user
    res.redirect('/user/homepage');
  }
);

// router.post('/request-email-change', isUserAuth, authController.requestEmailChange);
// router.post('/verify-email-change', isUserAuth, authController.verifyEmailChange);


export default router;