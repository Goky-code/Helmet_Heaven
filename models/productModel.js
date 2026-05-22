import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true
  },

  stock: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE"
  }
});




const productSchema = new mongoose.Schema({

  productName: {
    type: String,
    required: true,
    trim: true
  },

  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand"
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  description: {
    type: String
  },

  productImage: [{
    type: String  
  }],

  variants: [variantSchema],

  isDeleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

const Product=mongoose.model("Product",productSchema)

export default Product