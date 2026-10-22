import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  
   firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
  type: String
},

profileImage: {
  type: String
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
    },
    referralCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
},

referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},

referralRewardProcessed: {
    type: Boolean,
    default: false
}

}, { timestamps: true });

const User=mongoose.model("User",userSchema)

export default User