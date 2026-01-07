const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/userController");

router.get("/", userController.getAdminUsers);
router.patch("/:id/status", userController.updateUserStatus);
router.delete("/:id", userController.deleteUser);

module.exports = router;