const User = require("../models/user.model");
const bcrypt = require("bcrypt");

exports.signup = async (data) => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const otp = Math.floor(100000 + Math.random() * 900000);

  const user = await User.create({
    ...data,
    password: hashedPassword,
    otp,
    otpExpiry: Date.now() + 60000
  });

  return { message: "User created, OTP sent", otp };
};