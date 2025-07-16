const Product = require("../models/product");
const Banner = require("../models/banner");
const Wishlist = require("../models/wishlist");

async function handleGetHome(req,res) {
  const banner = await Banner.findOne()
   res.render("client/home",{
    banner
   });
}

async function handleGetProducts(req, res) {
  const { search = "", category = "", sortBy = "" } = req.query;

  const filter = {
    name: { $regex: search, $options: "i" },
    category: { $regex: category, $options: "i" }
  };

  const sort = sortBy === "low-to-high" ? { price: 1 } :
               sortBy === "high-to-low" ? { price: -1 } :
               {};

  try {
    const products = await Product.find(filter).sort(sort).lean();

    let wishlist = null;
    if (req.user) {
      wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product").lean();
      if (wishlist) {
        wishlist.items = wishlist.items.filter(item => item.product);
      }
    }

    res.render("client/products", {
      products,
      wishlist,
      search,
      category,
      sortBy
    });

  } catch (error) {
    res.status(500).render("client/server-error", { message: error.message });
  }
}

async function handleGetProductDetails(req, res) {
  try {
    const product = await Product.findById(req.params.id).populate("reviews.user");
    if(req.user){
      const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
      return res.render("client/product-details", {
        product,
        wishlist ,
      });
    }
    const wishlist = null

    if (!product) {
      return res.status(404).render("client/server-error", {
        message: "Product not found",
      });
    }
    res.render("client/product-details", { product , wishlist});
  } catch (error) {
    res.status(500).render("client/server-error", {
      message: error.message,
    });
  }
}

async function handleFilterProducts(req, res) {
  let { search, category, sortBy } = req.query;

  search = search || "";
  category = category || "";

  const sortOrder = sortBy === "low-to-high" ? 1 : -1;

  try {
    const products = await Product.find({
      $and: [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: category, $options: "i" } }
      ]
    }).sort({ price: sortOrder });

    if(req.user){
      const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
      return res.render("client/products", {
        products,
        wishlist ,
      });
    }
    const wishlist = null

    res.status(200).render("client/products", {
      products,
      wishlist
    });

  } catch (error) {
    res.status(500).render("client/server-error", {
      message: error.message,
    });
  }
}


async function handleGetBuses(req, res) {
  try {

    const products = await Product.find({ category: "bus" });

    if(req.user){
      const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
      return res.render("client/buses", {
        products,
        wishlist ,
      });
    }

    const wishlist = null

    res.render("client/buses", {
      products,
      wishlist
    });
  } catch (error) {
    res.status(500).render("client/server-error", {
      message: error.message,
    });
  }
}

async function handleGetTrucks(req, res) {
  try {
    const products = await Product.find({ category: "truck" });

  if(req.user){
      const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
      return res.render("client/trucks", {
        products,
        wishlist ,
      });
    }

    const wishlist = null

    res.render("client/trucks", {
      products,
      wishlist
    });
  } catch (error) {
    res.status(500).render("client/server-error", {
      message: error.message,
    });
  }
}

async function handleGetLightVehicles(req, res) {
  try {

    const products = await Product.find({ category: "lmv" });

    if(req.user){
      const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
      return res.render("client/light-vehicles", {
        products,
        wishlist ,
      });
    }

    const wishlist = null;

    res.render("client/light-vehicles", {
      products,
      wishlist
    });
  } catch (error) {
    res.status(500).render("client/server-error", {
      message: error.message,
    });
  }
}

async function handleGetMediumVehicles(req, res) {
  try {
    const products = await Product.find({ category: "mmv" });
    if(req.user){
      const wishlist = await Wishlist.findOne({ user: req.user.id }).populate("items.product");
      return res.render("client/medium-vehicles", {
        products,
        wishlist ,
      });
    }
    const wishlist = null
    res.render("client/medium-vehicles", {
      products,
      wishlist
    });
  } catch (error) {
    res.status(500).render("client/server-error", {
      message: error.message,
    });
  }
}

async function handleGetService(req,res) {
   res.render("client/services");
}

async function handleGetAbout(req,res) {
   res.render("client/about");
}

async function handleGetContact(req, res) {
  res.render("client/contact");
}

async function handleGetServerError(req,res) {
   res.render("client/server-error");
}


module.exports = {
  handleGetHome,
  handleGetProducts,
  handleFilterProducts,
  handleGetProductDetails,
  handleGetBuses,
  handleGetTrucks,
  handleGetLightVehicles,
  handleGetMediumVehicles,
  handleGetService,
  handleGetAbout,
  handleGetContact,
  handleGetServerError,
};
