
const express = require("express");
const router = express.Router();

const reportController = require("../controllers/admin/reportController"); 

router.get("/", reportController.getAllReports);
router.patch("/:id", reportController.handleReport);

module.exports = router;