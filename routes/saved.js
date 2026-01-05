const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const savedController = require("../controllers/savedController");

router.use(auth);

router.post("/toggle", savedController.toggleSave);
router.get("/", savedController.getSavedPosts);
router.get("/check/:postId", savedController.checkSaved);

module.exports = router;