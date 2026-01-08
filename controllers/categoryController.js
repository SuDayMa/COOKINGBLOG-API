const Category = require("../models/Category");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

// 1. Dùng cho cả App Mobile (User) và Admin Panel
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không lấy được danh mục" });
  }
};

// 2. CHỈ dành cho Admin: Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Tên không được để trống" });

    const newCategory = new Category({
      id: uuidv4(), // Tạo UUID cho Mobile
      name: name,
      slug: slugify(name, { lower: true }), // "Món Kho" -> "mon-kho"
      image: image || ""
    });

    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    res.status(400).json({ success: false, message: "Danh mục đã tồn tại hoặc dữ liệu lỗi" });
  }
};

// 3. CHỈ dành cho Admin: Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const result = await Category.deleteOne({ id: req.params.id }); // Xóa theo UUID
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }
    res.json({ success: true, message: "Đã xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};