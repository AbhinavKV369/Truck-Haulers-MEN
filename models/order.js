const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      replaceReason: {
        type: String,
        default: null,
      },
      replaceStatus: {
        type: String,
        enum: ["none", "requested", "approved", "replaced", "rejected"],
        default: "none",
      },
      replaceApprovedAt: {
        type: Date,
        default: null,
      },
      replaceRejectedAt: {
        type: Date,
        default: null,
      }
    }
  ],
  
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  address: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    }
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "paypal", "stripe", "razorpay"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  status: {
    type: String,
    enum: ["pending", "shipped", "delivered", "canceled"],
    default: "pending",
  },
  trackingNumber: {
    type: String,
    default: null,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
