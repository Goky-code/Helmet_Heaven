import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        description: {
            type: String,
            default: ""
        },

        discountType: {
            type: String,
            enum: ["PERCENTAGE", "FIXED"],
            required: true
        },

        discountValue: {
            type: Number,
            required: true,
            min: 1
        },

        maxDiscount: {
            type: Number,
            default: null,
            min: 0
        },

        minPurchase: {
            type: Number,
            default: 0,
            min: 0
        },

        startDate: {
            type: Date,
            required: true
        },

        expiryDate: {
            type: Date,
            required: true
        },

        isDisabled: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Coupon", couponSchema);