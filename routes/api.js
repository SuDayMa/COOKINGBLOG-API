const express = require("express");
const router = express.Router();

// Import các nhóm route
const authRoutes = require("./auth");
const userRoutes = require("./users");
const postRoutes = require("./posts");
const commentRoutes = require("./comments");
const savedRoutes = require("./saved");
const followerRoutes = require("./followers");     
const notificationRoutes = require("./notifications");
const reportRoutes = require("./reports");           

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const adminRoutes = require("./admin"); 

router.use("/", authRoutes); 

router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/saved", savedRoutes);
router.use("/followers", followerRoutes);        
router.use("/notifications", notificationRoutes); 

router.use("/admin", auth, adminOnly, adminRoutes);

module.exports = router;