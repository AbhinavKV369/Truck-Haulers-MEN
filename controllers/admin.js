const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const Banner = require("../models/banner");
const Message = require("../models/message");
const Coupon = require("../models/coupon");
const Cart = require("../models/cart");
const Wishlist = require("../models/wishlist");
const { sendMessage } = require("../services/nodeMailer");

async function createDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ name: process.env.ADMIN_NAME });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = new User({
        name: process.env.ADMIN_NAME,
        phone: 1234567890,
        email: "admin@truckhaulers.com",
        password: hashedPassword,
        isVerified: true,
        role: "admin",
      });

      await admin.save();
      console.log(" Default admin created");
    } else {
      console.log("Admin already exists");
    }
  } catch (err) {
    console.error("Error creating default admin", err);
  }
}

async function handleGetAdminLogin(req, res) {
  res.render("admin/admin-login", {
    message: null,
  });
}

async function handlePostAdminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res
        .status(401)
        .render("admin/admin-login", { message: "Invalid credential" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .render("admin/admin-login", { message: "Invalid credentials" });
    }
    const payload = {
      admin: {
        id: admin._id,
        role: admin.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect("/admin");
  } catch (error) {
    console.error("Admin login error:", error);
    res
      .status(500)
      .render("admin/admin-login", { message: "Something went wrong" });
  }
}

async function handleGetAdminPanel(req, res) {
  try {
    const [totalProducts, totalUsers, totalOrders] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    const [latestUser, latestProduct, latestOrder] = await Promise.all([
      User.findOne().sort({ createdAt: -1 }),
      Product.findOne().sort({ createdAt: -1 }),
      Order.findOne().sort({ createdAt: -1 }).populate("user"),
    ]);

    const orders = await Order.find();

    const latestShipped = await Order.countDocuments({ status: "shipped" });

    const trendingProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalOrdered: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          name: "$productDetails.name",
          totalOrdered: 1,
        },
      },
    ]);

    res.render("admin/admin-panel", {
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue,
      latestUser,
      latestProduct,
      latestOrder,
      latestShipped,
      orders,
      trendingProducts,
    });
  } catch (error) {
    console.error("Admin Panel Error:", error.message);
    res.status(500).render("server-error", {
      message: "Internal Server Error",
    });
  }
}

async function handleGetUsers(req, res) {
  const users = await User.find({});
  res.status(200).render("admin/manage-users", {
    users,
  });
}

async function handleGetUserProfile(req, res) {
  const user = await User.findById(req.params.id);
  res.status(200).render("admin/edit-user-profile", {
    user,
    message: null,
  });
}

async function handleUpdateUserProfile(req, res) {
  const { name, email, phone } = req.body;
  try {
    const updatedFields = { name, email, phone };
    await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    res.redirect("/admin/manage-users");
  } catch (error) {
    res.status(500).render("server-error", {
      message: error.message,
    });
  }
}

async function handleUserStatus(req, res) {
  try {
    const user = await User.findById(req.params.id);
    const newStatus = !user.isBlocked;

    await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: newStatus },
      { new: true }
    );

    res.json({ success: true, newStatus });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function handleGetSearchUsers(req, res) {
  const { search } = req.body;
  try {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    });
    res.status(200).render("admin/manage-users", {
      users,
    });
  } catch (error) {
    res.status(500).render("server-error", {
      message: error.message,
    });
  }
}

async function handlePostAddProducts(req, res) {
  const { name, description, price, category, engine, gvw } = req.body;

  try {
    const productImages = req.files.map((file) => file.path);

    const newProduct = new Product({
      name,
      description,
      engine,
      gvw,
      productImages,
      price,
      category,
    });

    await newProduct.save();

    res.render("admin/add-products", {
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send("server-error: ",error)
    };
  }

async function handleEditProduct(req, res) {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId);
    res.render("admin/edit-product", {
      product,
      message: null,
    });
  } catch {
    res.status(500).render("admin/server-error", {
      message: error.message,
    });
  }
}

async function handleUpdateProduct(req, res) {
  const { name, description, price, category, engine, gvw } = req.body;
  try {
    const updatedFields = { name, description, price, category, engine, gvw };
    if (req.files && req.files.length > 0) {
      updatedFields.productImages = req.files.map((file) => file.path);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

    res.render("admin/edit-product", {
      product,
      message: "Product updated successfuly",
    });
  } catch (error) {
    res.status(500).render("admin/server-error", {
      message: error.message,
    });
  }
}

async function handleGetAddProducts(req, res) {
  res.render("admin/add-products", {
    message: null,
  });
}

async function handleGetProducts(req, res) {
  const products = await Product.find();
  res.status(200).render("admin/manage-products", {
    products,
  });
}

async function handleDeleteProducts(req, res) {
  try {
    const productId = req.params.id;
    await Product.findByIdAndDelete(productId);
    await Cart.updateMany({}, { $pull: { items: { product: productId } } });
    await Wishlist.updateMany({}, { $pull: { items: { product: productId } } });
    res.redirect("/admin/manage-products");
  } catch (error) {
    res.status(500).render("server-error", {
      message: error.message,
    });
  }
} 

async function handleGetManageOrders(req, res) {
  const orders = await Order.find({})
    .populate("user")
    .populate("items.product");
  res.status(200).render("admin/manage-orders", {
    orders,
  });
}

async function handleOrderStatus(req, res) {
  const { orderStatus } = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId); // simplified

    if (!order) {
      return res.status(404).render("admin/server-error", {
        message: "Order not found",
      });
    }

    order.status = orderStatus;
    order.updatedAt = new Date();

    await order.save();

    res.redirect("/admin/manage-orders");
  } catch (error) {
    res.status(500).render("admin/server-error", {
      message: error.message,
    });
  }
}

async function handleViewUserOrderDetails(req, res) {
  const productId = req.params.id;
  try {
    const order = await Order.findById({ _id: productId })
      .populate("user")
      .populate("items.product");
    if (!order) {
      return res.status(400).send({
        message: "Order not found",
      });
    }
    res.status(200).render("admin/view-user-order", { order });
  } catch (error) {
    res.status(500).render("admin/server-error", {
      message: error.message,
    });
  }
}

async function handleDeleteOrder(req, res) {
  const orderId = req.params.id;
  try {
    await Order.findByIdAndDelete({ _id: orderId });
    res.redirect("/admin/manage-orders");
  } catch (error) {
    res.status(200).render("client/server-error", {
      message: error.message,
    });
  }
}

const handleApproveItemReplace = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      req.flash("err", "Order not found");
      return res.redirect("/admin/manage-orders");
    }

    const item = order.items.id(itemId);
    if (!item) {
      req.flash("err", "Item not found in order");
      return res.redirect("/admin/manage-orders");
    }

    if (item.replaceStatus !== "requested") {
      req.flash("err", "Replacement request is not pending");
      return res.redirect("/admin/manage-orders");
    }

    item.replaceStatus = "approved";
    item.replaceApprovedAt = new Date();

    await order.save();

    req.flash("suc", "Replacement request approved successfully");
    res.redirect("/admin/manage-orders");
  } catch (error) {
    console.error("Error approving replacement:", error);
    req.flash("err", "Server error while approving replacement");
    res.redirect("/admin/manage-orders");
  }
};

const handleRejectItemReplace = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      req.flash("err", "Order not found");
      return res.redirect("/admin/manage-orders");
    }

    const item = order.items.id(itemId);
    if (!item) {
      req.flash("err", "Item not found in order");
      return res.redirect("/admin/manage-orders");
    }

    if (item.replaceStatus !== "requested") {
      req.flash("err", "Replacement request is not pending");
      return res.redirect("/admin/manage-orders");
    }

    item.replaceStatus = "rejected";
    item.replaceRejectedAt = new Date();

    await order.save();

    req.flash("suc", "Replacement request rejected successfully");
    res.redirect("/admin/manage-orders");
  } catch (error) {
    console.error("Error rejecting replacement:", error);
    req.flash("err", "Server error while rejecting replacement");
    res.redirect("/admin/manage-orders");
  }
};

async function handleConfirmReplace(req, res) {
  const { orderId, itemId } = req.params;

  try {
    const order = await Order.findById(orderId).populate("items.product");
    if (!order || !Array.isArray(order.items)) {
      console.log("err", "Order or items not found");
      return res.redirect("/admin/manage-orders");
    }

    const item = order.items.id(itemId);
    if (!item) {
      console.log("err", "Item not found in the order");
      return res.redirect("/admin/manage-orders");
    }

    if (order.status !== "delivered") {
      console.log("err", "Replacement can only be confirmed after delivery");
      return res.redirect("/admin/manage-orders");
    }

    item.replaceStatus = "replaced";
    item.replacedAt = new Date();

    if (!item.replaceApprovedAt) {
      item.replaceApprovedAt = new Date();
    }

    await order.save();

    console.log("suc", "Replacement request approved successfully");
    res.redirect("/admin/manage-orders");
  } catch (error) {
    console.error("Error confirming replacement:", error);
    res.status(500).render("server-error", { message: error.message });
  }
}

async function handleGetAllCoupons(req, res) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).render("admin/manage-coupons", {
      coupons,
      error: null,
      message: null,
    });
  } catch (err) {
    res.status(500).render("server-error", { message: err.message });
  }
}

async function handleCreateCoupon(req, res) {
  try {
    const { code, discountAmount, expiryDate } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      const coupons = await Coupon.find();
      return res.status(400).render("admin/manage-coupons", {
        coupons,
        error: "Coupon code already exists",
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountAmount,
      expiryDate,
    });

    await coupon.save();
    res.redirect("/admin/manage-coupons");
  } catch (err) {
    res.status(500).render("server-error", { message: err.message });
  }
}

async function handleSearchCoupons(req, res) {
  try {
    const { search } = req.body;

    const coupons = await Coupon.find({
      code: { $regex: search, $options: "i" },
    });

    res
      .status(200)
      .render("admin/manage-coupons", { coupons, error: null, message: null });
  } catch (err) {
    res.status(500).render("server-error", { message: err.message });
  }
}

async function handleDeleteCoupon(req, res) {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.redirect("/admin/manage-coupons");
  } catch (err) {
    res.status(500).render("server-error", { message: err.message });
  }
}

async function handleToggleCouponStatus(req, res) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .render("server-error", { message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.redirect("/admin/manage-coupons");
  } catch (err) {
    res.status(500).render("server-error", { message: err.message });
  }
}

async function handleGetSearchMessages(req, res) {
  const { search } = req.body;
  try {
    const messages = await Message.find({
      $or: [
        { subject: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    });

    res.status(200).render("admin/user-messages", {
      messages,
    });
  } catch (error) {
    res.status(500).render("server-error", {
      message: error.message,
    });
  }
}

async function handleGetMessages(req, res) {
  const messages = await Message.find({}).sort({ createdAt: 1 });
  res.status(200).render("admin/user-messages", {
    messages,
    reply: req.query.reply,
  });
}

async function handleDeleteMessages(req, res) {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.redirect("/admin/user-messages");
  } catch (error) {
    res.status(500).render("server-error", {
      message: error.message,
    });
  }
}

async function handleReplyToUser(req, res) {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).send({ error: "Email and message are required." });
    }

    await sendMessage(email, message);

    res.redirect("/admin/user-messages?reply=success");
  } catch (error) {
    res.status(500).render("server-error", {
      message: error.message,
    });
  }
}

async function handleGetAddBanner(req, res) {
  try {
    const banner = await Banner.findOne();
    res.status(200).render("admin/add-banner", {
      message: null,
      banner,
    });
  } catch (error) {
    res.status(500).send("server-error", 
       error.message,
    );
  }
}
async function handlePostAddBanner(req, res) {
  try {
    const { heading, description } = req.body;
    const bannerImage = req.file?.path;

    let banner = await Banner.findOne();

    if (banner) {
      banner.heading = heading;
      banner.description = description;

      if (bannerImage) {
        banner.bannerImage = bannerImage;
      }

      await banner.save();
    } else {
      banner = new Banner({
        heading,
        description,
        bannerImage,
      });
      await banner.save();
    }

    res.status(201).render("admin/add-banner", {
      message: "Banner saved successfully",
      banner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Server error" });
  }
}


async function handleAdminLogout(req, res) {
  try {
    res.clearCookie("adminToken");
    req.flash("success", "Admin logout successful");
    res.redirect("/");
  } catch (error) {
    req.flash("error", "Server error: " + error.message);
    res.redirect("/");
  }
}

module.exports = {
  createDefaultAdmin,
  handleGetAdminLogin,
  handlePostAdminLogin,

  handleGetAdminPanel,
  handleGetUsers,
  handleGetSearchUsers,
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleUserStatus,

  handleGetManageOrders,
  handleOrderStatus,
  handleViewUserOrderDetails,
  handleApproveItemReplace,
  handleRejectItemReplace,
  handleConfirmReplace,
  handleDeleteOrder,

  handlePostAddProducts,
  handleGetAddProducts,
  handleGetProducts,
  handleEditProduct,
  handleUpdateProduct,
  handleDeleteProducts,

  handleGetAllCoupons,
  handleCreateCoupon,
  handleSearchCoupons,
  handleDeleteCoupon,
  handleToggleCouponStatus,

  handleGetMessages,
  handleGetSearchMessages,
  handleReplyToUser,
  handleDeleteMessages,

  handleGetAddBanner,
  handlePostAddBanner,
  handleAdminLogout,
};
