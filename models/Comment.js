const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },

    post_id: { 
      type: String, 
      required: true, 
      index: true 
    },

    user_id: { 
      type: String, 
      required: true, 
      index: true 
    },

    content: { 
      type: String, 
      required: true,
      trim: true 
    },

    status: { 
      type: String, 
      enum: ["visible", "hidden"], 
      default: "visible", 
      index: true 
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false 
  }
);

commentSchema.index({ content: "text" });

module.exports = mongoose.model("Comment", commentSchema);