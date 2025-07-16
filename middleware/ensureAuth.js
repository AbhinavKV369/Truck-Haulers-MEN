function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    if (req.xhr ) {
      return res.status(401).json({ success: false, message: "You need to login first" });
    } else {
      req.flash('error', "You need to login first");
      return res.redirect('/login');
    }
  }
  next();
}

module.exports = ensureAuthenticated;
