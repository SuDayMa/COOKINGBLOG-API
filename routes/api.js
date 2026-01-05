// routes/api.js
const express = require("express");

const authRoutes = require("./auth");
const userRoutes = require("./users");
const postRoutes = require("./posts");
const commentRoutes = require("./comments");
const savedRoutes = require("./saved");

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const adminRoutes = require("./admin"); // routes/admin/index.js

const router = express.Router();

// AUTH
router.use("/", authRoutes);

// USER
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/saved", savedRoutes);

router.use("/admin", auth, adminOnly, adminRoutes);

module.exports = router;
