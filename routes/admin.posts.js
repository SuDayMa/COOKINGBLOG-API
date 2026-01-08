const express = require("express");
const router = express.Router();
const postController = require("../controllers/admin/postController");
console.log("Admin Post Controller Methods:", Object.keys(postController));
router.get("/", postController.getAdminPosts);
if (postController.getAdminPostDetail) {
    router.get("/:id", postController.getAdminPostDetail);
} else {
    console.warn("CẢNH BÁO: Chưa khai báo hàm getAdminPostDetail trong Controller!");
}
if (postController.updatePostStatus) {
    router.patch("/:id/status", postController.updatePostStatus);
}
if (postController.deletePost) {
    router.delete("/:id", postController.deletePost);
}
module.exports = router;