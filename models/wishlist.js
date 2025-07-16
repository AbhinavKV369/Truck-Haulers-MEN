const mongoose = require("mongoose");

const wishlistModel = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"    
    },
    items:[{
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Product"
        },
    }]
});

const Wishlist = mongoose.model("Wishlist", wishlistModel);

module.exports = Wishlist;