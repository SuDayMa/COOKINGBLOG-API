const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

router.get("/", async (req, res) => {
  const cats = await Category.find().lean();
  res.json({ success: true, data: cats });
});

module.exports = router;