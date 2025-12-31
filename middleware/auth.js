const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };

    const u = await User.findOne({ id: req.user.id }).select("id is_blocked");
    if (!u) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (u.is_blocked) return res.status(403).json({ success: false, message: "Account blocked" });

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid/expired" });
  }
};
