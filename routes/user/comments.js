const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const commentController = require("../controllers/commentController");

router.get("/", commentController.getCommentsByPost);

router.use(auth); 
router.post("/", commentController.createComment);
router.delete("/:id", commentController.deleteUserComment);

module.exports = router;