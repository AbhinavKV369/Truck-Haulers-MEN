const express = require("express");
const router = express.Router();

const { upload } = require("../services/cloudinaryMulter");
const {
  createDefaultAdmin,
  handleGetAdminLogin,
  handlePostAdminLogin,

  handleGetAdminPanel,

  handleGetUsers,
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleUserStatus,
  handleGetSearchUsers,

  handleGetProducts,
  handleGetAddProducts,
  handlePostAddProducts,
  handleEditProduct,
  handleUpdateProduct,
  handleDeleteProducts,

  handleGetManageOrders,
  handleViewUserOrderDetails,
  handleOrderStatus,
  handleApproveItemReplace,
  handleRejectItemReplace,
  handleDeleteOrder,

  handleGetAddBanner,
  handlePostAddBanner,

  
  handleGetMessages,
  handleDeleteMessages,
  handleGetSearchMessages,
  handleGetAllCoupons,
  handleCreateCoupon,
  handleToggleCouponStatus,
  handleDeleteCoupon,
  handleSearchCoupons,
  handleAdminLogout,
  handleReplyToUser,
  handleConfirmReplace,
 
} = require("../controllers/admin");

const adminAuth = require("../middleware/adminAuth");

createDefaultAdmin();


router.get("/login", handleGetAdminLogin);
router.post("/login", handlePostAdminLogin);


router.get("/",adminAuth, handleGetAdminPanel);

router.get("/manage-users",adminAuth, handleGetUsers);
router.get("/edit-user/:id",adminAuth,handleGetUserProfile);
router.post("/update-profile/:id",adminAuth, handleUpdateUserProfile);
router.post("/toggle-user-status/:id",adminAuth, handleUserStatus);
router.post("/search-users",adminAuth, handleGetSearchUsers);

router.get("/manage-products",adminAuth, handleGetProducts);
router.get("/add-products",adminAuth, handleGetAddProducts);
router.post("/add-product",adminAuth, upload.array("productImage[]", 5), handlePostAddProducts);
router.get("/edit-product/:id",adminAuth, handleEditProduct);
router.post("/edit-product/:id",adminAuth, upload.array("productImage[]", 5), handleUpdateProduct);
router.post("/delete-product/:id",adminAuth, handleDeleteProducts);

router.get("/manage-orders", handleGetManageOrders);
router.get("/view-user-order/:id", handleViewUserOrderDetails);
router.post("/update-order-status/:id", handleOrderStatus);
router.post("/approve-replace/:orderId/:itemId", adminAuth, handleApproveItemReplace);
router.post("/reject-replace/:orderId/:itemId", adminAuth, handleRejectItemReplace);
router.post("/product-replaced/:orderId/:itemId", adminAuth, handleConfirmReplace);
router.post("/delete-order/:id",adminAuth, handleDeleteOrder);

router.get("/manage-coupons",adminAuth,handleGetAllCoupons);
router.post("/manage-coupons",adminAuth,handleCreateCoupon);

router.post("/coupons/toggle/:id",adminAuth,handleToggleCouponStatus);
router.get("/coupons/delete/:id",adminAuth,handleDeleteCoupon);
router.post("/manage-coupons/search",adminAuth,handleSearchCoupons);
router.get("/add-banner",adminAuth, handleGetAddBanner);
router.post("/add-banner", upload.single("bannerImage"), handlePostAddBanner);

router.get("/user-messages",adminAuth,handleGetMessages);
router.post("/search-messages",adminAuth,handleGetSearchMessages);
router.post("/reply-to-user",adminAuth,handleReplyToUser);
router.post("/delete-message/:id",adminAuth, handleDeleteMessages);

router.get("/logout",handleAdminLogout);

const pages = [{ route: "/server-error", view: "server-error" }];

pages.forEach((page) => {
  router.get(page.route, async (req, res) => {
    try {
      res.render(`admin/${page.view}`);
    } catch (error) {
      res.status(500).render("client/server-error");
    }
  });
});

module.exports = router;
