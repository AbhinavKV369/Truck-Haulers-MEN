const express = require("express");
const ensureAuth = require("../middleware/ensureAuth");

const {
  handleGetWishlist,
  handleToggleWishlist,
} = require("../controllers/wishlist"); 

const router = express.Router();

router.get("/wishlist", ensureAuth, handleGetWishlist);
router.post("/wishlist/toggle", ensureAuth, handleToggleWishlist);

module.exports = router;
