const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // UUID
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Category", categorySchema);