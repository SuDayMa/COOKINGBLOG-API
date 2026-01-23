const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    
    user_id: { 
      type: String, 
      required: true, 
      index: true 
    }, 
    
    post_id: { 
      type: String, 
      required: true, 
      index: true 
    },
    
    saved_at: { 
      type: Date, 
      default: Date.now 
    },
  },
  { 
    timestamps: false,
    versionKey: false 
  }
);

savedPostSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

module.exports = mongoose.model("SavedPost", savedPostSchema);