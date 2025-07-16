const express = require("express");
const authorizedUser = require("../middleware/userAuth");
const {
  handleGetCheckout,
  handleCreateCODOrder,
  handleGetMyOrders,
  handleCancelOrder,
  handleReplaceProduct,
  handlePostReview,
  handleGetCreateInvoice,
  handleCreateStripeCheckoutSession,
  handleStripePaymentSuccess,
} = require("../controllers/order");

const router = express.Router();

router.post("/order-summary", authorizedUser, handleCreateCODOrder);
router.post("/create-stripe-session", authorizedUser, handleCreateStripeCheckoutSession);
router.get("/payment-success", handleStripePaymentSuccess);


router.post("/cancel-order/:id", authorizedUser, handleCancelOrder);
router.post("/replace-product/:orderId/:itemId",handleReplaceProduct);
router.post("/review-product/:id",handlePostReview)

router.get("/checkout", authorizedUser, handleGetCheckout);
router.get("/order-invoice/:id",authorizedUser,handleGetCreateInvoice);
router.get("/my-orders", authorizedUser, handleGetMyOrders);

module.exports = router;
