const jwt = require("jsonwebtoken");
const User = require("../models/user");
const secret = process.env.JWT_SECRET;

async function userAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.user.id); 
    if (!user) {
      res.locals.user = null;
      return next();
    }

    req.user = user;
    res.locals.user = user;
  } catch (error) {
    console.error("Auth error:", error.message);
    res.locals.user = null;
  }

  next();
}

module.exports = userAuth;

