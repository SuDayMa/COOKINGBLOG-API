const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const postController = require("../controllers/postController"); 
const multer = require("multer");

const upload = multer({ dest: "uploads/" }); 
router.get("/me", auth, postController.getMyPosts);
router.route("/")
  .get(postController.getPosts) 
  .post(auth, upload.single("image"), postController.createPost);

module.exports = router;