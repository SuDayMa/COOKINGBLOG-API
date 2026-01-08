const express = require("express");
const router = express.Router();
const postController = require("../controllers/admin/postController");

console.log("DANH SÁCH HÀM NHẬN ĐƯỢC:", Object.keys(postController));
router.get("/", postController.getAdminPosts);
router.get("/:id", postController.getAdminPostDetail); 
router.patch("/:id/status", postController.updatePostStatus);
router.delete("/:id", postController.deletePost);

module.exports = router;