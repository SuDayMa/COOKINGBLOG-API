const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema(
  {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: false,
    versionKey: false 
  }
);

savedPostSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

module.exports = mongoose.model("SavedPost", savedPostSchema);
mongoose.model("SavedPost").collection.dropIndex("id_1").catch(err => console.log("Index id_1 không tồn tại hoặc đã xóa"));