import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: function () {
      return this.authType === "local";
    },
  },

  authType: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },

  isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    }

}, { timestamps: true });

const User=mongoose.model("User",userSchema)

export default User