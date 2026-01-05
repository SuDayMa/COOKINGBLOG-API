const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/:id", userController.getPublicProfile);
router.get("/:id/posts", userController.getUserPosts);
router.put("/profile", auth, userController.updateProfile);
module.exports = router;