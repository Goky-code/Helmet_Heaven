const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);