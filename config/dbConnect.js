const mongoose = require("mongoose");

async function dbConnect(url){
    mongoose.connect(url)
    .then(()=>{ console.log("mongoDB connected successfully")});
};

module.exports = dbConnect;

