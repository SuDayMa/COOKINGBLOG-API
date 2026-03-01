const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");

const adminAuth = require("./auth");
const adminDashboard = require("./dashboard");
const adminPosts = require("./posts");
const adminUsers = require("./users");
const adminComments = require("./comments");
const adminReports = require("./reports");
const adminCategories = require("./categories");
const adminNotifications = require("./notifications"); 

router.use("/auth", adminAuth); 
router.use(auth); 
router.use(adminOnly); 

router.use("/dashboard", adminDashboard); 
router.use("/posts", adminPosts);
router.use("/users", adminUsers);
router.use("/comments", adminComments);
router.use("/reports", adminReports);
router.use("/categories", adminCategories);
router.use("/notifications", adminNotifications); 

module.exports = router;