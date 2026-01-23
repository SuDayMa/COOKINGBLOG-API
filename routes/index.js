const express = require("express");
const router = express.Router();

// --- 1. IMPORT ROUTE USER 
const authRoutes = require("./user/auth"); 
const userRoutes = require("./user/users");
const postRoutes = require("./user/posts");
const commentRoutes = require("./user/comments");
const savedRoutes = require("./user/saved");
const followerRoutes = require("./user/followers");     
const notificationRoutes = require("./user/notifications");
const reportRoutes = require("./user/reports");       
const categoryRoutes = require("./user/categories");    

// --- 2. IMPORT ROUTE ADMIN 
const adminRoutes = require("./admin/index"); 

// --- 3. PHÂN LUỒNG USER (APP) 
router.use("/auth", authRoutes); 
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/saved", savedRoutes);
router.use("/followers", followerRoutes);        
router.use("/notifications", notificationRoutes); 
router.use("/reports", reportRoutes);
router.use("/categories", categoryRoutes);

// --- 4. PHÂN LUỒNG ADMIN 
router.use("/admin", adminRoutes);

module.exports = router;