const nodemailer = require('nodemailer');
const crypto = require("crypto");
require("dotenv").config();

function generateOTP(){
   return crypto.randomInt(100000,999999).toString();
}

async function sendMessage(email,message){
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: process.env.my_email,
            pass: process.env.my_password
        }
    });

    await transporter.sendMail({
        from:process.env.my_email,
        to: email,
        subject: "TRUCK HAULERS ",
        html: `<h1>Message from Truck Haulers</h1> 
        <h2>${message}</h2>
        <p>Dont share this code to anyone</p>`
    })
}

module.exports = {
    generateOTP,
    sendMessage,
}
