import User from "../models/userModels.js"

import * as profileService from "../services/user/profileService.js";
import * as addressService from "../services/user/addressService.js";
import * as emailService from "../services/user/EmailService.js";
import * as passwordService from "../services/user/passwordService.js";

export const getLogin = (req, res) => {
    const blocked = req.query.blocked === 'true';
    res.render("user/login", {
        error: blocked ? "You have been blocked. Please contact support." : null
    });
};

export const logout =(req,res)=>{
    
      req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.redirect("/user/profileinformation"); 
        }
        
        
        res.clearCookie('connect.sid'); 
        
      
        res.redirect("/user/login")
          
     })
}

export const getsignup = async(req,res)=>{
     return res.render('user/signup')
}

export const getOtp = (req, res) => {
  const signupData = req.session.signupData;
  res.render('user/verifyOtp', {
    newEmail: signupData?.email || null,
    otpExpiry: signupData?.otpExpiry || null,
    otpError: null
  });
}

export const getHome = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.redirect('/user/login');
    }
    res.render('user/homepage');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

export const getforgotPassword=(req,res)=>{
     res.render('user/forgotPassword', { message: null })
}

export const getVerifyforgotOtp=async(req,res)=>{
      const email = req.session.resetEmail;
  const user = await User.findOne({ email });

     res.render('user/verifyForgotpassOtp',{
      otpExpiry: user?.otpExpiry ?? null, 
    otpError: null,
     })
}

export const getresetPassword=(req,res)=>{
     res.render('user/resetPassword')
}

export const getProfile = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.redirect("/user/login");
    }

    const user =
      await profileService.getUserProfile(
        req.session.user._id
      );

    res.render(
      "user/profileinformation",
      { user }
    );

  } catch (error) {

    console.log(error);

    res.status(500).send("Server Error");

  }
};

export const updateProfile = async (req, res) => {
  try {

    const updatedUser =
      await profileService.updateUserProfile(
        req.session.user._id,
        req.body,
        req.file
      );

    req.session.user = updatedUser;

    res.json({
      success: true,
    });

  } catch (error) {

    console.log(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};


export const getAddresses = async (req, res) => {
  try {

    if (!req.session.user) {
      return res.redirect("/user/login");
    }

    const addresses =
      await addressService.getUserAddresses(
        req.session.user._id
      );

    res.render(
      "user/address/addressPage",
      { addresses }
    );

  } catch (error) {

    console.log(error);

    res.status(500).send("Server Error");

  }
};


export const getAddAddress = (req, res) => {
  res.render("user/address/addNewaddress");
};
export const addAddress = async (req, res) => {
  try {

    await addressService.createAddress(
      req.session.user._id,
      req.body
    );

    res.redirect(
      "/user/address/addressPage"
    );

  } catch (error) {

    console.log(error);

    res.status(500).send(error.message);

  }
};

export const getEditAddress = async (
  req,
  res
) => {

  try {

    const address =
      await addressService.getAddressById(
        req.params.id
      );

    res.render(
      "user/address/editAddress",
      { address }
    );

  } catch (error) {

    console.log(error);

    res.redirect(
      "/user/address/addressPage"
    );

  }
};

export const updateAddress = async (
  req,
  res
) => {

  try {

    await addressService.editAddress(
      req.session.user._id,
      req.params.id,
      req.body
    );

    res.redirect(
      "/user/address/addressPage"
    );

  } catch (error) {

    console.log(error);

    res.status(400).send(
      error.message
    );

  }
};

export const deleteAddress = async (
  req,
  res
) => {

  try {

    await addressService.removeAddress(
      req.params.id
    );

    res.redirect(
      "/user/address/addressPage"
    );

  } catch (error) {

    console.log(error);

    res.redirect(
      "/user/address/addressPage"
    );

  }
};

export const setDefaultAddress = async (
  req,
  res
) => {

  try {

    await addressService.makeDefaultAddress(
      req.session.user._id,
      req.params.id
    );

    res.redirect(
      "/user/address/addressPage"
    );

  } catch (error) {

    console.log(error);

    res.redirect(
      "/user/address/addressPage"
    );

  }
};


export const sendEmailOTP = async (req, res) => {

  try {

    const { newEmail } = req.body;

    await emailService.sendOTPForEmailChange(
      req.session.user._id,
      newEmail
    );

    req.session.newEmail = newEmail;

    res.json({
      success: true,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });

  }

};

export const loadOTPPage = (req, res) => {
  res.render("user/editEmailotp",{
      newEmail: req.session.newEmail
  });
  
};

export const verifyEmailOTP = async (req, res) => {

  try {

    await emailService.verifyOTPForEmailChange(
      req.session.user._id,
      req.session.newEmail,
      req.body.otp
    );

    req.session.destroy();

    res.redirect("/user/login");

  } catch (error) {

    res.render("user/editEmailotp", {
      message: error.message,
      newEmail: req.session.newEmail,
    });

  }

};

export const resendEmailOTP = async (req, res) => {

  try {

    await emailService.resendOTPForEmailChange(
      req.session.user._id,
      req.session.newEmail
    );

    res.json({
      success: true,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });

  }

};

export const passwordchange=(req,res)=>{
  res.render('user/passwordChange')
}

export const changePassword = async (req, res) => {

  try {

    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    await passwordService.updatePassword(
      req.session.user._id,
      currentPassword,
      newPassword,
      confirmPassword
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });

  }

};
