const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly"); 


router.get("/", categoryController.getAllCategories); 

router.post("/", auth, adminOnly, categoryController.createCategory);

router.delete("/:id", auth, adminOnly, categoryController.deleteCategory);

module.exports = router;