const User = require("../models/User");

module.exports = async function adminOnly(req, res, next) {
  try {
    // auth middleware phải set req.user.id
    const user = await User.findOne({ id: req.user?.id }).select("id role is_blocked");
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: "Account blocked" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden (admin only)" });
    }

    next();
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
