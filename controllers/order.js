const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const fs = require("fs")

const Order = require("../models/order");
const Cart = require("../models/cart");
const User = require("../models/user");
const Product = require("../models/product");
const Coupon = require("../models/coupon");


const { generatePdfInvoice, generateDocxInvoice } = require("../services/invoiceGenerator");

async function handleGetCheckout(req, res) {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    const coupons = await Coupon.find({ isActive: true });
    const userDetails = await User.findById(userId);

    if (!cart || cart.items.length === 0) return res.redirect("/cart");

    res.render("client/checkout", {
      userDetails,
      phone: userDetails.phone,
      address: userDetails.addresses,
      cart,
      coupon: coupons,
      items: cart.items,
    });
  } catch (err) {
    res.status(500).render("client/server-error", { message: err.message });
  }
}

async function handleCreateCODOrder(req, res) {
  try {
    const { address, paymentMethod, couponCode } = req.body;
    const user = await User.findById(req.user.id);
    const cart = await Cart.findOne({ user: user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) return res.redirect("/cart");
    if (!address || !paymentMethod) {
      req.flash("error", "Address and payment method are required.");
      return res.redirect("/checkout");
    }

    let coupon = null;
    let discount = 0;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      const now = new Date();
      if (!coupon || coupon.expiryDate < now || coupon.usedBy.includes(user._id)) {
        req.flash("error", "Invalid or expired coupon.");
        return res.redirect("/checkout");
      }
      discount = coupon.discountAmount || 0;
      coupon.usedBy.push(user._id);
      await coupon.save();
    }

    const orderedItems = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
    }));

    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tax = subtotal * 0.3;
    const total = subtotal + tax - discount;

    const newOrder = new Order({
      user,
      items: orderedItems,
      totalAmount: total,
      address,
      paymentMethod,
      orderDate: new Date(),
      paymentStatus: "paid",
      status: "pending",
      isPaid: true,
    });

    await newOrder.save();
    cart.items = [];
    await cart.save();

    req.flash("success", "Order placed successfully!");
    res.render("client/order-summary", {
      items: orderedItems,
      user,
      address,
      coupon,
      price: {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).render("client/server-error", { message: error.message });
  }
}

async function handleCreateStripeCheckoutSession(req, res) {
  try {
    const userId = req.user._id;
    const { address, couponCode } = req.body;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) return res.redirect("/cart");

    let discount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon || coupon.expiryDate < new Date() || coupon.usedBy.includes(userId)) {
        req.flash("error", "Invalid or expired coupon.");
        return res.redirect("/checkout");
      }
      discount = coupon.discountAmount || 0;
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const totalAmount = Math.max(subtotal - discount, 0);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: { name: "Truck Haulers Order" },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/payment-success?userId=${userId}&address=${encodeURIComponent(JSON.stringify(address))}&coupon=${couponCode || ''}`,
      cancel_url: `${req.protocol}://${req.get("host")}/checkout`,
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe Error:", err.message);
    res.status(500).render("client/server-error", { message: err.message });
  }
}

async function handleStripePaymentSuccess(req, res) {
  try {
    const { userId, address: rawAddress, coupon } = req.query;
    const address = JSON.parse(decodeURIComponent(rawAddress));

    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!user || !cart || cart.items.length === 0) return res.redirect("/");

    let discount = 0;
    let usedCoupon = null;

    if (coupon) {
      usedCoupon = await Coupon.findOne({ code: coupon.toUpperCase(), isActive: true });
      if (usedCoupon && !usedCoupon.usedBy.includes(user._id)) {
        discount = usedCoupon.discountAmount || 0;
        usedCoupon.usedBy.push(user._id);
        await usedCoupon.save();
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tax = subtotal * 0.3;
    const total = subtotal + tax - discount;

    const order = new Order({
      user: user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      totalAmount: total,
      address,
      paymentMethod: "stripe",
      status: "pending",
      paymentStatus: "paid",
      orderDate: new Date(),
    });

    await order.save();
    cart.items = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id).populate("items.product");

    res.render("client/order-summary", {
      user,
      address,
      items: populatedOrder.items, 
      coupon: usedCoupon,
      price: {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
      }
    });
  } catch (err) {
    console.error("Stripe Payment Success Error:", err.message);
    res.status(500).render("client/server-error", { message: "Payment processing failed." });
  }
}

async function handleGetMyOrders(req, res) {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId }).populate("items.product");

    res.status(200).render("client/my-orders", { orders });
  } catch (error) {
    res.status(500).render("client/server-error", { message: error.message });
  }
}

async function handleCancelOrder(req, res) {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({ user: userId, _id: orderId });

    if (!order) {
      req.flash("error", "Order not found.");
      return res.redirect("/my-orders");
    }

    order.status = "canceled";
    await order.save();

    req.flash("success", "Order canceled successfully.");
    res.redirect("/my-orders");
  } catch (error) {
    res.status(500).render("client/server-error", { message: error.message });
  }
}

async function handleReplaceProduct(req, res) {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      req.flash("error", "Replacement reason is required.");
      return res.redirect("/my-orders");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      req.flash("error", "Order not found.");
      return res.redirect("/my-orders");
    }

    const updatedAtTime = new Date(order.updatedAt).getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (Date.now() < updatedAtTime + oneDayInMs) {
      req.flash("error", "Replacement can only be requested after 1 day of update.");
      return res.redirect("/my-orders");
    }

    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) {
      req.flash("error", "Item not found in this order.");
      return res.redirect("/my-orders");
    }

    if (item.replaceStatus && item.replaceStatus !== "none") {
      req.flash("error", `This item already has a replacement status: ${item.replaceStatus}.`);
      return res.redirect("/my-orders");
    }

    item.replaceStatus = "requested";
    item.replaceReason = reason;
    item.replaceRequestedAt = new Date();

    await order.save();

    req.flash("success", "Replacement request submitted successfully.");
    return res.redirect("/my-orders");

  } catch (error) {
    console.error("Error in handleReplaceProduct:", error);
    req.flash("error", "Something went wrong. Please try again later.");
    res.redirect("/my-orders");
  }
}

async function handlePostReview(req, res) {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;

    
    const isPurchased = await Order.findOne({
      user: userId,
      "items.product": productId,
      status: "delivered" 
    });

    if (!isPurchased) {
      req.flash("error","You have'nt purchased this");
      return res.redirect(`/view-product/${productId}`);
    }

    const product = await Product.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }

  
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    );
 
    if (alreadyReviewed) {
      req.flash("error", "You have already reviewed");
      return res.redirect(`/view-product/${productId}`);
    }

    const newReview = {
      user: userId,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(newReview);

    product.numberOfReviews = product.reviews.length;
    product.averageRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numberOfReviews;

    await product.save();

    req.flash("success", "Review added successfully.");
    res.redirect(`/view-product/${productId}`);
  } catch (err) {
    console.error("Error posting review:", err);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/products");
  }
}

async function handleGetCreateInvoice(req, res) {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findById(orderId).populate("items.product").lean();
    const user = await User.findById(userId).lean();

    if (!order || !user) {
      return res.status(404).send("Order or user not found");
    }

    const invoiceDir = path.join(__dirname, "../public/invoices");
   
    const pdfFileName = `invoice-${orderId}.pdf`;
    const pdfPath = path.join(invoiceDir, pdfFileName);
    await generatePdfInvoice(order, user, pdfPath);

    const docxFileName = `invoice-${orderId}.docx`;
    const docxPath = path.join(invoiceDir, docxFileName);
    await generateDocxInvoice(order, user, docxPath);


    req.flash(
      "success",
      `Invoice generated successfully. 
      <a href="/invoices/${pdfFileName}" class="btn btn-sm btn-outline-success ms-2">Download PDF</a>
      <a href="/invoices/${docxFileName}" class="btn btn-sm btn-outline-primary ms-2">Download DOCX</a>`
    );

    return res.redirect("/my-orders");

  } catch (error) {
    console.error(error);
    return res.status(500).render("client/server-error", { message: error.message });
  }
}


async function latestOrder(req, res) {
  try {
    const order = await Order.findOne()
      .sort({ createdAt: -1 })
      .populate("user")
      .populate("items.product");

    res.render("client/order-summary1", { order });
  } catch (error) {
    res.status(500).render("client/server-error", { message: error.message });
  }
}
  
module.exports = {
  handleGetCheckout,
  handleCreateCODOrder,
  handleCreateStripeCheckoutSession,
  handleStripePaymentSuccess,
  handleGetMyOrders,
  handleCancelOrder,
  handleReplaceProduct,
  handlePostReview,
  handleGetCreateInvoice,
  latestOrder,
};
