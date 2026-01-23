const Category = require("../../models/Category"); 
const slugify = require("slugify");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    
    const data = categories.map(cat => ({
      ...cat,
      image: toPublicUrl(req, cat.image)
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Không lấy được danh mục" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Tên không được để trống" });

    const imageUrl = req.file ? req.file.path : req.body.image;

    const newCategory = new Category({
      id: `cat-${Date.now()}`, 
      name: name,
      slug: slugify(name, { lower: true, locale: 'vi' }), 
      image: imageUrl || ""
    });

    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    res.status(400).json({ success: false, message: "Danh mục đã tồn tại hoặc dữ liệu lỗi" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, locale: 'vi' });
    }
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updated = await Category.findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật danh mục" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const result = await Category.deleteOne({ id: req.params.id }); 
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
    }
    res.json({ success: true, message: "Đã xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};