const express = require("express");
const router = express.Router();

const upload = require("../../utils/fileUpload"); 
const auth = require("../../middleware/auth"); 
const userController = require("../../controllers/userController");



router.delete("/me", auth, userController.deleteMyAccount);
router.put("/profile", auth, userController.updateProfile);
router.patch("/update-avatar", auth, upload.single("avatar"), userController.updateAvatar);
router.post("/change-password", auth, userController.changePassword);


router.get("/", userController.getAllUsers);
router.get("/:id", userController.getPublicProfile);
router.get("/:id/posts", userController.getUserPosts);

module.exports = router;