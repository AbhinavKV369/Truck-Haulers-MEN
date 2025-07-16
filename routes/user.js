const express = require("express");

const {
  handlePostRegister,
  handlePostOtp,
  handlePostLogin,
  handlePostEditProfile,
  handleSubmitMessage,
  handlePostChangePassword,
  handleDeleteAccount,
  handleGetHome,
  handleGetRegister,
  handleGetOtp,
  handleGetLogin,
  handleGetUserDashboard,
  handleGetEditProfile,
  handleGetChangePassword,
  handleLogout,
  handleGetServerError,
  handleGetForgotPassword,
  handlePostForgotPassword,
  handleGetResetOtp,
  handlePostResetOtp,
  handlePostResetPassword,
  handleGetAddAddress,
  handlePostAddAddress,
  handlePostDeleteAddress,
  handleGetOffers,
  handleGetResetPassword,
} = require("../controllers/user");


const router = express.Router();

router.post("/register", handlePostRegister);
router.post("/verify-otp", handlePostOtp);
router.post("/login", handlePostLogin);
router.post("/reset-otp",handlePostResetOtp );
router.post("/reset-password",handlePostResetPassword);
router.post("/forgot-password",handlePostForgotPassword);
router.post("/edit-profile", handlePostEditProfile);
router.post("/add-address",handlePostAddAddress);
router.post("/delete-address/:id",handlePostDeleteAddress);
router.post("/submit-message", handleSubmitMessage);
router.post("/change-password", handlePostChangePassword);
router.post("/delete-account", handleDeleteAccount);

router.get("/", handleGetHome);
router.get("/register", handleGetRegister);
router.get("/verify-otp", handleGetOtp);
router.get("/login", handleGetLogin);
router.get("/forgot-password",handleGetForgotPassword);
router.get("/reset-otp",handleGetResetOtp);
router.get("/reset-password",handleGetResetPassword);
router.get("/user-dashboard", handleGetUserDashboard);
router.get("/edit-profile",  handleGetEditProfile);
router.get("/add-address",handleGetAddAddress);
router.get("/change-password", handleGetChangePassword);
router.get("/logout", handleLogout);
router.get('/coupons',handleGetOffers);
router.get("/server-error", handleGetServerError);

module.exports = router;
 