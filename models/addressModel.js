import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  name: String,
  street: String,
  apartment: String,
  city: String,
  state: String,
  zip: String,
  phone: String,

  isDefault: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

const Address = mongoose.model("Address", addressSchema);

export default Address;