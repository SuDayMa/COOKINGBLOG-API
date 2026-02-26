const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const followerController = require("../../controllers/followerController");


router.post("/toggle", auth, followerController.toggleFollow);

router.get("/:userId/following", followerController.getFollowingList);
router.get("/:userId/check", auth, followerController.checkFollowStatus); // Thêm dòng này
module.exports = router;