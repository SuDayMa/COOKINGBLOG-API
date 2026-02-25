const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const postController = require("../../controllers/postController"); 
const upload = require("../../utils/fileUpload");

router.get("/me", auth, postController.getMyPosts);

router.get("/:id", postController.getPostDetail); 

router.route("/")
  .get(postController.getPosts) 
  .post(
    auth, 
    upload.fields([
      { name: "images", maxCount: 10 }, 
      { name: "video", maxCount: 1 }    
    ]), 
    postController.createPost
  );

module.exports = router;