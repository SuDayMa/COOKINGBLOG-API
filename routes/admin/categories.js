const express = require("express");
const router = express.Router();

const categoryController = require("../../controllers/admin/categoryController");

const auth = require("../../middleware/auth");
const adminOnly = require("../../middleware/adminOnly");
const upload = require("../../utils/fileUpload"); 

// --- ROUTES ---

router.get("/", categoryController.getAllCategories); 

router.post("/", auth, adminOnly, upload.single("image"), categoryController.createCategory);

router.put("/:id", auth, adminOnly, upload.single("image"), categoryController.updateCategory);

router.delete("/:id", auth, adminOnly, categoryController.deleteCategory);

module.exports = router;