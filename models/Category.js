const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, 
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model("Category", categorySchema);