const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: { 
    type: Number, 
    required: true
   },
  comment: String,
},{timestamps:true});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  engine: {
    type: String,
    required: true,
    trim: true,
  },
  gvw: {
    type: String,
    required: true,
    trim: true,
  },
  productImages: [String],
  price: {
    type: Number,
    required: true,
    min: 100000,
  },
  category: {
    type: String,
    enum: ["truck", "bus", "lmv", "mmv"],
    required: true,
  },
  reviews: [reviewSchema],
  averageRating: { 
    type: Number,
     default: 0
     },
  numberOfReviews: {
     type: Number,
      default: 0
     }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
