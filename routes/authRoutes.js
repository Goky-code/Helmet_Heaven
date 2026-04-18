import express from "express"
import passport from "passport";
import * as authController from "../controllers/authControllers.js"

const router = express.Router();

router.post("/login",authController.login);


router.post("/signup", authController.signup);
router.post('/verifyOtp',authController.verifyOtp)
router.get('/resendOtp',authController.resendOtp)
router.post('/forgotPassword',authController.forgotPassword)
router.post('/verifyForgotpassOtp',authController.verifyForgotOtp)
router.post('/resetPassword',authController.resetPassword)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  (req, res) => {
    req.session.user=req.user
    res.redirect('/user/homepage');
  }
);

export default router;