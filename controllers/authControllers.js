import User from "../models/userModels.js";
import authServices from "../services/authServices.js";
import generateOTP from "../utils/generateOtp.js";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Minimum 6 characters required' });
    }

    const result = await authServices.loginUser(email, password);
    if (result.success) {
      req.session.user = result.user;
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
};

export const signup = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      confirmpassword,
      referalcode,
    } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmpassword) {
      return res.render("user/signup", { message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.render("user/signup", {
        message: "Password must be at least 8 characters",
      });
    }

    if (password !== confirmpassword) {
      return res.render("user/signup", { message: "password does not match" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.render("user/signup", { message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user/signup", {
        message: "Email already exists",
      });
    }

    
    const otp = generateOTP();

   
    req.session.signupData = {
      firstname,
      lastname,
      email,
      password,
      referalcode,
      otp,
      otpExpiry: Date.now() + 2 * 60 * 1000,
    };

    
    await sendEmail(email, "Your OTP", `Your OTP is ${otp}`);

    res.redirect("/user/verifyOtp");

  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const signupData = req.session.signupData;

    if (!signupData) {
      return res.render("user/signup", {
        message: "Session expired, please sign up again",
      });
    }

   
    if (String(signupData.otp) !== String(otp)) {
      return res.render("user/verifyOtp", { message: "Invalid OTP" });
    }

   
    if (Date.now() > signupData.otpExpiry) {
      return res.render("user/verifyOtp", { message: "OTP expired" });
    }

   
    const result = await authServices.registerUser({
      firstname: signupData.firstname,
      lastname: signupData.lastname,
      email: signupData.email,
      password: signupData.password,
      referalcode: signupData.referalcode,
    });

    if (!result.success) {
      return res.render("user/signup", { message: result.message });
    }


    req.session.signupData = null;

    res.redirect("/user/login");

  } catch (error) {
    console.error("Otp verification error", error);
    res.status(500).send("Server Error");
  }
};

export const resendOtp = async (req, res) => {
  try {
    const signupData = req.session.signupData;

    
    if (!signupData) {
      return res.redirect("/user/signup");
    }
    const otp = generateOTP();

    signupData.otp = otp;
    signupData.otpExpiry = Date.now() + 2 * 60 * 1000;

    req.session.signupData = signupData;

   
    await sendEmail(signupData.email, "Your OTP", `Your OTP is ${otp}`);

    console.log("Resent OTP:", otp);

    res.redirect("/user/verifyOtp");

  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
};

export const forgotPassword = async (req, res) => {
    
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("auth/forgotPassword", { message: "user not found" });
    }
    const otp = generateOTP();

    user.otp = otp;
    user.otpExpiry = Date.now() +30 * 1000;

    await user.save();
    await sendEmail(email, "Your OTP", `Your OTP is ${otp}`);

    req.session.resetEmail = email;
    res.redirect("/auth/verifyForgotpassOtp");
  } catch (error) {
    res.status(500).send("server error");
  }
};

export const verifyForgotOtp = async (req, res) => {
  try {
    console.log("Verify OTP route hit!");

    const { otp } = req.body;
    const email = req.session.resetEmail;

    console.log("OTP received:", otp);
    console.log("Email from session:", email);

   
    if (!email) {
      return res.redirect("/auth/forgotPassword");
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found!");
      return res.redirect("/auth/forgotPassword");
    }
    
      if(String(user.otp) === String(otp) &&
      user.otpExpiry > Date.now())
     { 

      req.session.isOtpVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      return res.redirect("/user/resetPassword");
    } else {
      return res.render("user/verifyForgotpassOtp", {
        message: "Invalid or Expired OTP",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


export const resendOtpforgot = async (req, res) => {
  try {
    const email = req.session.resetEmail; 
    if (!email) {
      return res.redirect("/auth/forgotPassword");
    }

    const user = await User.findOne({ email });

     if (!user) {
      return res.redirect("/auth/forgotPassword");
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpiry = Date.now() + 2 * 60 * 1000;

    await user.save();

    await sendEmail(email, "Your OTP", `Your OTP is ${otp}`);

    
    res.render("user/verifyForgotpassOtp", { message: "OTP resent successfully!" });
  } catch (error) {
    res.status(500).send("Server error while resending OTP");
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmpassword } = req.body;
    const email = req.session.resetEmail;

     if (!email || !req.session.isOtpVerified) {
      return res.redirect("/auth/forgotPassword");
    }
      
     if (!password || !confirmpassword) {
      return res.render("user/resetPassword", {
        message: "All fields are required",
      });
    }

    if (password !== confirmpassword) {
      return res.render("user/resetPassword", {
        message: "passwords do not match",
      });
    }
    const user = await User.findOne({ email });

     if (!user) {
      return res.redirect("/auth/forgotPassword");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.otp = null;

    await user.save();

    req.session.resetEmail = null;
    req.session.isOtpVerified = null;


    res.redirect("/user/login");
  } catch (error) {
    res.status(500).send("server error");
  }
};


// export const requestEmailChange = async (req, res) => {
//     try {
//         const { newEmail } = req.body;
//         const userId = req.session.user._id;

        
//         const userExists = await User.findOne({ email: newEmail });
//         if (userExists) return res.status(400).json({ message: "This email already exists" });

       
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
       
//         req.session.emailChangeData = {
//             newEmail,
//             otp,
//             expiresAt: Date.now() + 10 * 60 * 1000 
//         };

       
//         await sendEmail(newEmail, otp); 
//         res.status(200).json({ message: "OTP send" });
//     } catch (error) {
//         res.status(500).json({ message: "Server error" });
//     }
// };

// export const verifyEmailChange = async (req, res) => {
//     try {
//         const { otp } = req.body;
//         const sessionData = req.session.emailChangeData;

        
//         if (!sessionData) return res.status(400).json({ message: "Timeout." });
//         if (Date.now() > sessionData.expiresAt) return res.status(400).json({ message: "OTP Expired" });
//         if (sessionData.otp !== otp) return res.status(400).json({ message: "wrong OTP." });

        
//         await User.findByIdAndUpdate(req.session.user._id, { email: sessionData.newEmail });

        
//         req.session.user.email = sessionData.newEmail;

       
//         delete req.session.emailChangeData;

//         res.status(200).json({ message: "email successfully changed" });
//     } catch (error) {
//         res.status(500).json({ message: "Server error" });
//     }
// };