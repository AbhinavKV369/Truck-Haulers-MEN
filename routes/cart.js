const express = require("express");
const authorisedUser = require("../middleware/userAuth");
const ensureAuth = require("../middleware/ensureAuth");

const {
  handleGetCart,
  handleAddToCart,
  handleIncCartCount,
  handleDecCartCount,
  handleDeleteCartItem
} = require("../controllers/cart");

const router = express.Router();

router.post("/add-cart", ensureAuth, handleAddToCart);
router.post("/cart/decrement/:id", ensureAuth, handleDecCartCount);
router.post("/cart/increment/:id", ensureAuth, handleIncCartCount);
router.post("/remove-item/:id", ensureAuth, handleDeleteCartItem);
router.get("/cart", ensureAuth, handleGetCart);

module.exports = router;
