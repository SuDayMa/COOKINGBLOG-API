const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const postSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    
    user_id: { type: String, required: true, index: true },
    category_id: { type: String, required: true, index: true }, 
    
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: null },
    
    ingredients: { type: String, default: null },
    steps: { type: String, default: null },

    likes: { 
      type: Number, 
      default: 0, 
      min: 0,
      index: true,
      get: v => Math.round(v) || 0,
      set: v => v === null || v === undefined ? 0 : v
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
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

postSchema.index({ title: "text", description: "text" });

postSchema.pre('save', function(next) {
  if (this.likes === null || this.likes === undefined) {
    this.likes = 0;
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);