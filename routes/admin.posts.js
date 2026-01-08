const express = require("express");
const router = express.Router();
const postController = require("../controllers/admin/postController");

console.log("DANH SÁCH HÀM TRONG CONTROLLER:", Object.keys(postController));

if (!postController.getAdminPosts) console.error("LỖI: Thiếu hàm getAdminPosts");
if (!postController.updatePostStatus) console.error("LỖI: Thiếu hàm updatePostStatus");
if (!postController.deletePost) console.error("LỖI: Thiếu hàm deletePost");

router.get("/", postController.getAdminPosts);
if (postController.updatePostStatus) {
    router.patch("/:id/status", postController.updatePostStatus);
}
if (postController.deletePost) {
    router.delete("/:id", postController.deletePost);
}
module.exports = router;