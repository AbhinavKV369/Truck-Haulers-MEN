const mongoose = require("mongoose");

const bannerSchema = mongoose.Schema({
  heading: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  bannerImage: {
    type: String,
  },
});

const Banner = mongoose.model("Banner",bannerSchema);

module.exports = Banner;