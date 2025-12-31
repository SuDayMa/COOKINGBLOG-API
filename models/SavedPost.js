const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const savedPostSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    post_id: { type: String, required: true, index: true },
    saved_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// tránh 1 user lưu 1 post nhiều lần
savedPostSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

module.exports = mongoose.model("SavedPost", savedPostSchema);
