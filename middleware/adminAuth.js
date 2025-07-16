const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  const token = req.cookies.adminToken;

  if (!token) {
    req.flash("error","Dont try to access without authorization")
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.admin.role !== "admin") {
      return res.status(403).render("admin/admin-login", { message: "Unauthorized access" });
    }

    req.admin = decoded.admin; 
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.clearCookie("adminToken");
    res.redirect("/");
  }
}

module.exports = adminAuth;
