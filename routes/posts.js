const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const postController = require("../controllers/postController"); 


router.route("/")
  .get(postController.getPosts)     
  .post(auth, postController.createPost); 

module.exports = router;