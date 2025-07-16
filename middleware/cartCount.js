const Cart = require("../models/cart");

async function handleGetCartCount(req, res, next) {
  if (!req.user) {
    res.locals.cartCount = 0;
    return next();
  }

  try {
    const cart = await Cart.findOne({ user: req.user.id });

    const cartCount = cart && cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    res.locals.cartCount = cartCount;
   
    next();
  } catch (error) {
    console.error("Error fetching cart count:", error);
    res.locals.cartCount = 0;
    next();
  }
}

module.exports = handleGetCartCount;
