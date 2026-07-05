import User from "../models/userModels.js";
import sendEmail from "../utils/sendEmail.js";

export const sendOTPForEmailChange = async (userId, newEmail) => {

  const existingUser = await User.findOne({ email: newEmail });

  if (existingUser) {
    throw new Error("This email is already registered.");
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  await User.findByIdAndUpdate(userId, {
    otp,
    otpExpiry: Date.now() + 5 * 60 * 1000,
  });

  await sendEmail(
    newEmail,
    "Email Change OTP",
    `Your OTP for email change is: ${otp}`
  );

  return otp;
};

export const verifyOTPForEmailChange = async (
  userId,
  newEmail,
  otp
) => {

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.otpExpiry < Date.now()) {
    throw new Error("OTP expired");
  }

  if (user.otp.toString() !== otp.toString()) {
    throw new Error("Invalid OTP");
  }

  user.email = newEmail;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();
};

export const resendOTPForEmailChange = async (
  userId,
  newEmail
) => {

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  await User.findByIdAndUpdate(userId, {
    otp,
    otpExpiry: Date.now() + 5 * 60 * 1000,
  });

  await sendEmail(
    newEmail,
    "Email Change OTP",
    otp
  );
};