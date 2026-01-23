const express = require("express");
const router = express.Router();
const authController = require("../controllers/admin/authController");

// POST /api/admin/login
router.post("/login", authController.login);

module.exports = router;