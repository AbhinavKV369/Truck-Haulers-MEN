const WishList = require("../models/wishlist");

async function handleGetWishlistCount(req, res, next) {
  if (!req.user) {
    res.locals.wishlistCount = 0;
    return next();
  }

  try {
    const wishlist = await WishList.findOne({ user: req.user.id });

    const wishlistCount = wishlist?.items?.length || 0;
    res.locals.wishlistCount = wishlistCount;

    next();
  } catch (error) {
    console.error("Wishlist count middleware error:", error.message);
    res.locals.wishlistCount = 0; 
    next();
  }
}

module.exports = handleGetWishlistCount;
