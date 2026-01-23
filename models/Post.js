const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
  
    
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",                         
      required: true, 
      index: true 
    },
    
    category_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category",                     
      required: true, 
      index: true 
    }, 
    
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    images: [{ type: String }], 
    
    video: { type: String, default: null }, 
    
    post_type: { 
      type: String, 
      enum: ["image", "video"], 
      default: "image",
      index: true
    },
    
    ingredients: { type: Array, default: [] },
    
    steps: { type: Array, default: [] },

    likes: { 
      type: Number, 
      default: 0, 
      min: 0,
      index: true
    },

    comments: { type: Number, default: 0 },
    
    status: { 
      type: String, 
      enum: ["pending", "approved", "hidden", "rejected"], 
      default: "pending", 
      index: true 
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

postSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Post", postSchema);