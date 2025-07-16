const User = require("../models/user");
const Message = require("../models/message");
const Coupon = require("../models/coupon")
const jwt = require("jsonwebtoken");
const { hashTheValue, compareTheValue } = require("../services/hashing");
const { generateOTP, sendMessage } = require("../services/nodeMailer");
const secret = process.env.JWT_SECRET;
// POST: Register

async function handlePostRegister(req, res) {
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email || !password) {
    req.flash("error", "All fields are required");
    return res.redirect("/register");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "User already exists");
      return res.redirect("/register");
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      req.flash(
        "error",
        "Password must be at least 8 characters long, contain one letter, one number, and one special character."
      );
      return res.redirect("/register");
    }

    const hashedPassword = await hashTheValue(password, 12);
    const otpCode = generateOTP(6);
    const newUser = new User({
      name,
      phone,
      email,
      password: hashedPassword,
      otp: otpCode,
      otpExpires: Date.now() + 5 * 60 * 1000,
    });

    await newUser.save();
    await sendMessage(email,`Your OTP code is ${otpCode}`);

    const payload = { user: { id: newUser.id } };
    const token = jwt.sign(payload, secret);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.flash("success", "OTP sent to your email");
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/register");
  }
}

async function handlePostOtp(req, res) {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      req.flash("error", "Invalid OTP or OTP expired");
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    user.isVerified = true;
    user.userStatus = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    req.flash("success", `OTP verified successfully, welcome ${user.name}`);
    return res.redirect("/");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  }
}

async function handlePostLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash("error", "All fields are required");
    return res.redirect("/login");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Incorrect email")
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    const isPasswordMatch = await compareTheValue(password, user.password);
    if (!isPasswordMatch) {
      console.log("Incorrect password")
      req.flash("error", "Incorrect password");

      return res.redirect("/login");
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.flash("success", `Login successful, welcome ${user.name}`);
    return res.redirect("/");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/login");
  }
}

async function handlePostForgotPassword(req, res) {
  const { email } = req.body;
  try {
    const resetOtp = generateOTP();
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/forgot-password");
    }

    user.resetOtp = resetOtp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();
    await sendMessage(email,`Your OTP reset code is ${resetOtp}`);

    req.flash("success", "OTP sent to email, please verify");
    return res.redirect(`/reset-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/forgot-password");
  }
}

async function handlePostResetOtp(req, res) {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
      req.flash("error", "Invalid or expired OTP");
      return res.redirect(`/reset-otp?email=${encodeURIComponent(email)}`);
    }

    req.flash("success", "OTP verified, now reset your password");
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/reset-otp?email=${encodeURIComponent(email)}`);
  }
}

async function handlePostResetPassword(req, res) {
  const { email, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    req.flash("error", "All fields are required");
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  if (newPassword !== confirmPassword) {
    req.flash("error", "Passwords do not match");
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    req.flash(
      "error",
      "Password must be at least 8 characters long, contain one letter, one number, and one special character."
    );
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
    }

    const hashedPassword = await hashTheValue(newPassword, 12);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    req.flash("success", "Password changed successfully");
    return res.redirect("/login");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }
}

async function handlePostEditProfile(req, res) {
  try {
    const { name, phone, email } = req.body;
    const updatedFields = { name, phone, email };
    await User.findByIdAndUpdate(req.user.id, updatedFields, { new: true });

    req.flash("success", "Profile updated successfully");
    return res.redirect("/edit-profile");
  } catch (error) {
    console.error("Edit profile error:", error);
    req.flash("error", error.message || "Something went wrong");
    return res.redirect("/edit-profile");
  }
}

async function handleGetEditProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/user-dashboard");
    }

    res.render("client/edit-profile", {
      user,
      messages: res.locals.messages,
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/user-dashboard");
  }
}

async function handleGetAddAddress(req, res) {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).render("client/add-addresses", {
      user,
      addresses: user.addresses,
      messages: res.locals.messages,
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/edit-profile");
  }
}

async function handlePostAddAddress(req, res) {
  const { addresses } = req.body;
  try {
    const newAddress = { ...addresses };

    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { addresses: newAddress } },
      { new: true }
    );

    req.flash("success", "Address added successfully");
    return res.redirect("/edit-profile");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/edit-profile");
  }
}

async function handlePostDeleteAddress(req, res) {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    req.flash("success", "Address deleted successfully");
    return res.redirect("/edit-profile");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/edit-profile");
  }
}
async function handlePostChangePassword(req, res) {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/change-password");
    }

    const isMatch = await compareTheValue(currentPassword, user.password);
    if (!isMatch) {
      req.flash("error", "Current password is incorrect");
      return res.redirect("/change-password");
    }

    if (currentPassword === newPassword) {
      req.flash("error", "New password cannot be the same as the current password");
      return res.redirect("/change-password");
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      req.flash(
        "error",
        "New password must be at least 8 characters, include a letter, a number, and a special character."
      );
      return res.redirect("/change-password");
    }

    if (newPassword !== confirmNewPassword) {
      req.flash("error", "New passwords do not match");
      return res.redirect("/change-password");
    }

    const hashedNewPassword = await hashTheValue(newPassword, 12);
    user.password = hashedNewPassword;
    await user.save();

    req.flash("success", "Password changed successfully");
    return res.redirect("/user-dashboard");
  } catch (error) {
    console.error("Password change error:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/change-password");
  }
}

async function handleLogout(req, res) {
  res.clearCookie("token");
  req.flash("success", "Logged out successfully");
  return res.redirect("/login");
}


async function handleSubmitMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/contact');  
    }

    const newMessage = new Message({ name, email, subject, message });
    await newMessage.save();

    req.flash('success', 'Message sent successfully!');
    res.redirect('/contact');
  } catch (error) {
    req.flash('error', 'Server error: ' + error.message);
    res.redirect('/contact');
  }
}

async function handleLogout(req, res) {
  try {
    res.clearCookie('token');
    req.flash('success', 'You have logged out successfully.');
    res.redirect('/');
  } catch (error) {
    req.flash('error', 'Server error: ' + error.message);
    res.redirect('/user-dashboard');
  }
}

async function handleDeleteAccount(req, res) {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie('token');

    req.flash('success', 'Account deletion successful');
    res.redirect('/');
  } catch (error) {
    req.flash('error', 'Error deleting account: ' + error.message);
    res.redirect('/user-dashboard');
  }
}

async function handleGetOffers(req, res) {
  try {
    const coupons = await Coupon.find({ 
      isActive: true, 
      expiryDate: { $gte: new Date() } 
    }).sort({ expiryDate: 1 });

    res.render('client/coupons', { coupons });
  } catch (error) {
    req.flash('error', 'Something went wrong.');
    res.redirect('/');
  }
}

async function handleGetHome(req, res) {
  res.render("client/home");
}

async function handleGetRegister(req, res) {
  res.render("client/register", {
    formData: {},
  });
}

async function handleGetOtp(req, res) {
  const email = req.query.email;

  if (!email) {
    req.flash("error", "Invalid request");
    return res.redirect("/register");
  }

  res.render("client/verify-otp", {
    email,
    formData: {},
  });
}

async function handleGetLogin(req, res) {
  res.render("client/login", {
    formData: {},
  });
}

async function handleGetForgotPassword(req, res) {
  res.status(200).render("client/forgot-password", {
    formData: {},
  });
}

async function handleGetResetOtp(req, res) {
  const email = req.query.email;

  if (!email) {
    req.flash("error", "Invalid request");
    return res.redirect("/forgot-password");
  }

  res.render("client/reset-otp", {
    email,
    formData: {},
  });
}


async function handleGetResetPassword(req, res) {
  const email = req.query.email
  res.render("client/reset-password",{
    email
  });
}

async function handleGetChangePassword(req, res) {
  try {
    const user = await User.findById(req.user.id);
    res.render("client/change-password", {
      user,
      formData: {},
    });
  } catch (error) {
    req.flash("error", "Failed to load change password page");
    res.redirect("/user-dashboard");
  }
}

async function handleGetUserDashboard(req, res) {
  res.render("client/user-dashboard");
}

async function handleGetServerError(req, res) {
  res.status(500).render("client/server-error");
}

module.exports = {
  handlePostRegister,
  handlePostOtp,
  handlePostLogin,
  handlePostForgotPassword,
  handlePostResetOtp,
  handlePostResetPassword,
  handlePostEditProfile,
  handlePostAddAddress,
  handlePostDeleteAddress,
  handleSubmitMessage,
  handlePostChangePassword,

  handleLogout,
  handleDeleteAccount,

  handleGetHome,
  handleGetRegister,
  handleGetOtp,
  handleGetLogin,
  handleGetForgotPassword,
  handleGetResetOtp,
  handleGetResetPassword,
  handleGetUserDashboard,
  handleGetEditProfile,
  handleGetAddAddress,
  handleGetChangePassword,
  handleGetOffers,
  handleGetServerError,
};
