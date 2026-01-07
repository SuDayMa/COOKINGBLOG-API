const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/:id", userController.getPublicProfile);
router.get("/:id/posts", userController.getUserPosts);
router.put("/profile", auth, userController.updateProfile);
router.patch("/update-avatar", auth, upload.single("avatar"), userController.updateAvatar);
module.exports = router;