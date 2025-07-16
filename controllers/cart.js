const Cart = require("../models/cart");

async function handleAddToCart(req, res) {

  const user = req.user.id;
 

  const { product } = req.body;

  try {
    let cart = await Cart.findOne({ user });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === product
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ product, quantity: 1 });
      }
    } else {
      cart = new Cart({ user, items: [{ product, quantity: 1 }] });
    }

    await cart.save();
    
    req.flash('success',"Item added to cart");
    res.redirect("/cart")
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function handleGetCart(req, res) {
  try {
    const user = req.user.id
   
    const cart = await Cart.findOne({ user: user}).populate("items.product");
    const total = cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0;
    const quantity = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    res.render("client/cart", {
      items: cart?.items || [],
      quantity,
      total,
    });
  } catch (error) { 
    res.render("client/server-error", { message: error.message });
  }
}

async function handleIncCartCount(req, res) {
  try {
    const user = req.user.id;
    const cart = await Cart.findOne({ user }).populate("items.product");

    const item = cart.items.find((item) => item.product._id.toString() === req.params.id);
    if (item) item.quantity += 1;

    await cart.save();

    const subTotal = item.product.price * item.quantity;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
   
    res.json({ success: true, subTotal, quantity: item.quantity, total, totalQuantity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function handleDecCartCount(req, res) {
  try {
    const user = req.user.id;
    const cart = await Cart.findOne({ user }).populate("items.product");

    const item = cart.items.find((item) => item.product._id.toString() === req.params.id);
    if (item) item.quantity -= 1;

    cart.items = cart.items.filter((item) => item.quantity > 0);
    await cart.save();

    const subTotal = item.product.price * item.quantity;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    res.json({ success: true, subTotal, quantity: item.quantity, total, totalQuantity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function handleDeleteCartItem(req, res) {
  try {
    const user = req.user.id;
    const product = req.params.id;

    const cart = await Cart.findOneAndUpdate(
      { user },
      { $pull: { items: { product } } },
      { new: true }
    ).populate("items.product");

    const total = cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0;
    res.json({ success: true, message: "Item removed", total, totalQuantity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  handleGetCart,
  handleAddToCart,
  handleIncCartCount,
  handleDecCartCount,
  handleDeleteCartItem,
};
