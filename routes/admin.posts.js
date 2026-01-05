const express = require("express");
const router = express.Router();
const postController = require("../controllers/admin/postController");

// Lưu ý: Middleware auth và adminOnly đã được check ở file routes/admin.js (file Hub) 
// nên ở đây không cần viết lại nữa cho gọn.

router.get("/", postController.getAdminPosts);
router.patch("/:id/status", postController.updatePostStatus);
router.delete("/:id", postController.deletePost);

module.exports = router;