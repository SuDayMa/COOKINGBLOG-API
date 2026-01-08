const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const savedPostSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },

    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    post_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Post", 
      required: true, 
      index: true 
    },
    saved_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

savedPostSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

module.exports = mongoose.model("SavedPost", savedPostSchema);