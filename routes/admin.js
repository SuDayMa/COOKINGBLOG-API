const express = require("express");
const router = express.Router();

// Import các route con
const adminAuth = require("./admin.auth");
const adminPosts = require("./admin.posts");
const adminUsers = require("./admin.users");
const adminComments = require("./admin.comments");
const adminStats = require("./admin.stats");
const adminReports = require("./admin.reports");


const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");


router.use("/", adminAuth);


router.use(auth, adminOnly); 

router.use("/posts", adminPosts);
router.use("/users", adminUsers);
router.use("/comments", adminComments);
router.use("/stats", adminStats);     
router.use("/reports", adminReports);

module.exports = router;