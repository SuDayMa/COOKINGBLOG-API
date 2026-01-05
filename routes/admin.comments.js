const express = require("express");
const router = express.Router();
const commentController = require("../controllers/admin/commentController");

router.get("/", commentController.getAdminComments);
router.patch("/:id/toggle-hidden", commentController.toggleCommentHidden);
router.delete("/:id", commentController.deleteComment);

module.exports = router;