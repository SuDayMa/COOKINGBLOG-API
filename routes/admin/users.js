const express = require("express");
const router = express.Router();
const userController = require("../../controllers/admin/userController");
const { verifyToken } = require("../../middlewares/authMiddleware"); 
const adminOnly = require("../../middlewares/adminOnly");           


router.use(verifyToken, adminOnly); 

router.get("/", userController.getAdminUsers);

router.patch("/:id/status", userController.updateUserStatus);

router.delete("/:id", userController.deleteUser);

module.exports = router;