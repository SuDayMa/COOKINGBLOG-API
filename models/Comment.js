const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const commentSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    post_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["visible", "hidden"], default: "visible", index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

module.exports = mongoose.model("Comment", commentSchema);
