const mongoose = require("mongoose");
const { applyTimestamps } = require("./user");

const messageSchema = mongoose.Schema({
    name:{
        type: String,
        required:true,
    },
     email:{
        type: String,
        required:true,
    },
     subject:{
        type: String,
        required:true,
    },
     message:{
        type: String,
        required:true,
    },
    date:{
        type: Date,
        default:Date.now
    }
},{timestamps:true})

const Message = mongoose.model("Message",messageSchema);

module.exports = Message;