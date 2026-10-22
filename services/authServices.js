import User from "../models/userModels.js";
import bcrypt from "bcryptjs";
import generateOTP from "../utils/generateOtp.js";
import sendEmail from "../utils/sendEmail.js";
import generateReferralCode from "../utils/generateReferralCode.js";
import { rewardReferral } from "./user/referralService.js";

export const loginUser = async (email, password) => {

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isBlocked) {
    throw new Error("User is blocked");
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

export const createSignupSession = async (
  signupData
) => {

  const {
    firstname,
    lastname,
    email,
    password,
    confirmpassword,
    referalcode,
  } = signupData;

  if (
    !firstname ||
    !lastname ||
    !email ||
    !password ||
    !confirmpassword
  ) {
    throw new Error("All fields are required");
  }

  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters"
    );
  }

  if (password !== confirmpassword) {
    throw new Error(
      "Passwords do not match"
    );
  }

 const emailRegex = /^\S+@\S+\.\S+$/;

  if (!emailRegex.test(email)) {
    throw new Error(
      "Invalid email format"
    );
  }

  const existingUser =
    await User.findOne({ email });

  if (existingUser) {
    throw new Error(
      "Email already exists"
    );
  }

    const enteredCode = referalcode?.trim().toUpperCase();

    if (enteredCode) {
        const referrer = await User.findOne({
            referralCode: enteredCode,
            isBlocked: false,
            isVerified: true
        });

        if (!referrer) {
            throw new Error("Invalid referral code");
        }
    }


  const otp = generateOTP();

  await sendEmail(
    email,
    "Your OTP",
    `Your OTP is ${otp}`
  );

  return {
    firstname,
    lastname,
    email,
    password,
    referalcode:enteredCode || "",
    otp,
    otpExpiry:
      Date.now() + 60 * 1000,
  };
};

export const registerUser = async (
  userData
) => {

  const existingUser =
    await User.findOne({
      email: userData.email,
    });

  if (existingUser) {
    throw new Error(
      "Email already exists"
    );
  }

    
  const enteredCode = userData.referalcode?.trim().toUpperCase();

  console.log(
  "Referral code during registration:",
  userData.referalcode
);

console.log("Normalized referral code:", enteredCode);
  let referrer=null

  if (enteredCode) {
    referrer = await User.findOne({
      referralCode: enteredCode,
      isBlocked: false,
      isVerified: true,
    })

      if (!referrer) {
      return {
        success: false,
        message: "Invalid referral code",
      };
    }
  }
    
   const referralCode=await generateReferralCode()

  const hashedPassword =
    await bcrypt.hash(
      userData.password,
      10
    )

  const user = new User({
    firstName: userData.firstname,
    lastName: userData.lastname,
    email: userData.email,
    password: hashedPassword,
    referralCode,
      referredBy: referrer ? referrer._id : null,
      referralRewardProcessed: false,
    isVerified: true,
  });

  await user.save();

  return {
    user,
    referrerId:referrer ? referrer._id : null
  }

}

export const verifySignupOtp = async (signupData, otp) => {

  if (!signupData) {
    throw new Error("Session expired, please sign up again");
  }

  if (Date.now() > signupData.otpExpiry) {
    throw new Error("OTP has expired");
  }

  if (String(signupData.otp) !== String(otp)) {
    throw new Error("Invalid OTP");
  }

  const user = await registerUser({
    firstname: signupData.firstname,
    lastname: signupData.lastname,
    email: signupData.email,
    password: signupData.password,
    referalcode: signupData.referalcode,
  })

  console.log("Referral ID:", user.referrerId);

  if (user.referrerId) {
   const rewardResult = await rewardReferral(
    user.user._id,
    user.referrerId
  )
  console.log("Reward result:", rewardResult);
}else {
    console.log("No referral code used. No referral reward.");
  }

  return user;
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

export const verifyForgotPasswordOtp =async(email,otp) => {

  if (!email) {
    throw new Error("Session expired");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (
    String(user.otp) !== String(otp) ||
    user.otpExpiry < Date.now()
  ) {
    throw new Error("Invalid or Expired OTP");
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

  if (!email || !isOtpVerified) {
    throw new Error("Unauthorized request");
  }

  if (!password || !confirmpassword) {
    throw new Error("All fields are required");
  }

  if (password !== confirmpassword) {
    throw new Error("Passwords do not match");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  return true;
}