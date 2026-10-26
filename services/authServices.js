import User from "../models/userModels.js";
import bcrypt from "bcryptjs";
import generateOTP from "../utils/generateOtp.js";
import sendEmail from "../utils/sendEmail.js";
import generateReferralCode from "../utils/generateReferralCode.js";
import { rewardReferral } from "./user/referralService.js";
import {normalizeEmail,validateName,validateEmail,validatePassword,validateConfirmPassword,validateOtp} from "../utils/validation.js";

export const loginUser = async (email, password) => {
   const normalizedEmail = validateEmail(email)

    if (typeof password !== "string" || !password) {
        throw new Error("Password is required.");
    }

  const user = await User.findOne({ email:normalizedEmail });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isBlocked) {
    throw new Error("User is blocked");
  }

    if (!user.password) {
        throw new Error(
            "This account cannot use password login. Please use Google login."
        )
    }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
};

export const createSignupSession = async ( signupData) => {

   if (!signupData || typeof signupData !== "object") {
        throw new Error("Invalid signup request.");
    }

  const {
    firstname,
    lastname,
    email,
    password,
    confirmpassword,
    referalcode,
  } = signupData

    const firstName = validateName(firstname, "First name");
    const lastName = validateName(lastname, "Last name");
    const normalizedEmail = validateEmail(email);
       
        validatePassword(password);

    validateConfirmPassword(
        password,
        confirmpassword )

        if (
        referalcode !== undefined &&
        typeof referalcode !== "string"
    ) {
        throw new Error("Invalid referral code.")
    }

   const enteredCode = referalcode
        ? referalcode.trim().toUpperCase()
        : "";

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new Error("An account with this email already exists.");
    }

   if (enteredCode) {
        const referrer = await User.findOne({
            referralCode: enteredCode,
            isBlocked: false,
            isVerified: true
        })


        if (!referrer) {
            throw new Error("Invalid referral code");
        }
    }


  const otp = generateOTP()

   const normalizedSignupData = {
        firstname: firstName,
        lastname: lastName,
        email: normalizedEmail,
        password,confirmpassword,
        referalcode: enteredCode,
        otp,
        otpExpiry: Date.now() + 60 * 1000
    }

  await sendEmail(
    email,
    "Your OTP",
    `Your OTP is ${otp}`)

    return normalizedSignupData
}

export const registerUser = async (
  userData
) => {

   if (!userData || typeof userData !== "object") {
        throw new Error("Invalid registration data.");
    }

     const firstName = validateName(
        userData.firstname,
        "First name"
    )

   const lastName = validateName(
        userData.lastname,
        "Last name"
    );

    
    const email = validateEmail(userData.email);

    
    validatePassword(userData.password);

   
    if (userData.password !== userData.confirmpassword) {
        throw new Error("Passwords do not match.");
    }

   
    const enteredCode =
        typeof userData.referalcode === "string"
            ? userData.referalcode.trim().toUpperCase()
            : "";

    
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("Email already exists.");
    }

   
    let referrer = null;

    if (enteredCode) {

        referrer = await User.findOne({
            referralCode: enteredCode,
            isBlocked: false,
            isVerified: true
        });

        if (!referrer) {
            throw new Error("Invalid referral code.");
        }
    }

    let referralCode;
    let referralCodeExists = true;

    while (referralCodeExists) {

        referralCode = await generateReferralCode();

        const existingReferralCode = await User.findOne({
            referralCode
        });

        referralCodeExists = Boolean(existingReferralCode);
    }

   
    const hashedPassword = await bcrypt.hash(
        userData.password,
        10
    )

    const newUser = new User({

        firstName,
        lastName,
        email,

        password: hashedPassword,

        referralCode,

       
        referredBy: referrer ? referrer._id : null,

      
        referralRewardProcessed: false,

        isVerified: true
    });

   
    await newUser.save();

   
    return {
        user: newUser,
        referrerId: referrer ? referrer._id : null
    }
}

export const verifySignupOtp = async (signupData, otp) => {

    
    if (!signupData) {
        throw new Error("Session expired, please sign up again.");
    }

    
    otp = validateOtp(otp);

    
    if (
        !signupData.otpExpiry ||
        Date.now() > new Date(signupData.otpExpiry).getTime()
    ) {
        throw new Error("OTP has expired.");
    }

   
    if (String(signupData.otp) !== otp) {
        throw new Error("Invalid OTP.");
    }

   
    const result = await registerUser({
        firstname: signupData.firstname,
        lastname: signupData.lastname,
        email: signupData.email,
        password: signupData.password,
        confirmpassword: signupData.confirmpassword,
        referalcode: signupData.referalcode,
    });

    console.log("Referral ID:", result.referrerId);

    
    if (result.referrerId) {

        const rewardResult = await rewardReferral(
            result.referrerId,
            result.user._id
        );

        console.log("Reward result:", rewardResult);

    } else {
        console.log("No referral code used. No referral reward.");
    }

    
    return result;
}

export const resendSignupOtp = async (signupData) => {

  if (!signupData) {
    throw new Error("Session expired");
  }

  const otp = generateOTP();

  signupData.otp = otp;
  signupData.otpExpiry = Date.now() + 60 * 1000;

  await sendEmail(
    signupData.email,
    "Your OTP",
    `Your OTP is ${otp}`
  );

  return signupData;
}

export const forgotPassword = async (email) => {

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("No account found with that email address.");
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 60 * 1000;

  await user.save();

  await sendEmail(
    email,
    "Your OTP",
    `Your OTP is ${otp}`
  );

  return user.email;
};

export const verifyForgotPasswordOtp = async (email, otp) => {
    if (!email) {
        throw new Error("Session expired. Please try again.");
    }

    otp = validateOtp(otp);

    const user = await User.findOne({
        email: normalizeEmail(email)
    });

    if (!user) {
        throw new Error("User not found.");
    }

    if (
        !user.otp ||
        !user.otpExpiry ||
        Date.now() > user.otpExpiry ||
        String(user.otp) !== otp
    ) {
        throw new Error("Invalid or expired OTP.");
    }

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return true;
}

export const resendForgotPasswordOtp =async(email) => {

  if (!email) {
    throw new Error("Session expired");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 60 * 1000;

  await user.save();

  await sendEmail(
    email,
    "Your OTP",
    `Your OTP is ${otp}`
  );

  return true;
}

export const resetUserPassword = async (
    email,
    isOtpVerified,
    password,
    confirmpassword
) => {
    if (!email || isOtpVerified !== true) {
        throw new Error("Unauthorized request.");
    }

    validatePassword(password);

    validateConfirmPassword(
        password,
        confirmpassword
    );

    const user = await User.findOne({
        email: normalizeEmail(email)
    });

    if (!user) {
        throw new Error("User not found.");
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return true;
}