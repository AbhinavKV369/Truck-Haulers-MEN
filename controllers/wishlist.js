const Wishlist = require("../models/wishlist");

async function handleGetWishlist(req, res) {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
        
        res.status(200).render("client/wishlist", { wishlist });
    } catch (error) {
        res.status(500).render("client/server-error", { message: error.message });
    }
}
async function handleToggleWishlist(req, res) {
  try {
    const productId = req.body.product;
    const userId = req.user?.id;

    let wishlist = await Wishlist.findOne({ user: userId });

    let isWishlisted = false;

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: [{ product: productId }],
      });
      isWishlisted = true;
    } else {
      const index = wishlist.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (index > -1) {
        wishlist.items.splice(index, 1);
        isWishlisted = false;
      } else {
        wishlist.items.push({ product: productId });
        isWishlisted = true;
      }
    }

    await wishlist.save();

    res.json({
      success: true,
      isWishlisted,
    });
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
    handleGetWishlist,
    handleToggleWishlist
};
