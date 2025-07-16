function connectFlash(req, res, next) {
  res.locals.messages = {
    success: req.flash('success')[0] || '',
    error: req.flash('error')[0] || ''
  };
  next();
}

module.exports = connectFlash;
