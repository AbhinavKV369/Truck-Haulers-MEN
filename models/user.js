const { required } = require("joi");
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: { 
      type: String, 
      default: ""
     },
    city: { 
      type: String,
       default: ""
       },
    district: { 
      type: String,
       default: ""
       },
    state: { 
      type: String,
       default: "" 
      },
    pincode: {
       type: String,
        default: null
       },
       phone:{
        type: Number,
        required:true,
       }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Username is required"],
    },
    phone: {
      type: Number,
      required: [true, "Phone number is required"],
      trim: true,
      unique: true,
      minLength: [10, "Must have 10 numbers"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      minLength: 5,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: { 
      type: String,
       default: "" 
      },
    otpExpires: { 
      type: Number,
       default: 0
       },
    resetOtp: {
       type: String,
        default: "" 
      },
    resetOtpExpires: {
       type: Number, 
       select: false,
        default: 0 
      },
    isVerified: { 
      type: Boolean,
       default: false
       },
    isBlocked: {
       type: Boolean,
        default: false 
      },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    addresses: {
      type: [addressSchema],
      default: [],
    }

  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
