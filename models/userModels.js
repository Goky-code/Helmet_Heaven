import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    minlength: [2, "First name must contain at least 2 characters"],
    maxlength: [30, "First name cannot exceed 30 characters"]
},

lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    minlength: [2, "Last name must contain at least 2 characters"],
    maxlength: [30, "Last name cannot exceed 30 characters"]
},

email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address"
    ]
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