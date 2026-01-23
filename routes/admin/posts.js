const express = require("express");
const router = express.Router();
const postController = require("../controllers/admin/postController");
const { verifyToken } = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminOnly");

console.log("Post Controller Methods:", Object.keys(postController));

router.use(verifyToken, adminOnly);

router.get("/", postController.getAdminPosts);

router.get("/:id", postController.getAdminPostDetail); 

router.patch("/:id/status", postController.updatePostStatus);

router.delete("/:id", postController.deletePost);

module.exports = router;