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

router.use("/auth", adminAuth);

router.use(auth, adminOnly); 

router.use("/dashboard", adminDashboard); 
router.use("/posts", adminPosts);
router.use("/users", adminUsers);
router.use("/comments", adminComments);
router.use("/reports", adminReports);
router.use("/categories", adminCategories);

module.exports = router;