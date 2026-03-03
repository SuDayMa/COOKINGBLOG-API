const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter_id: { 
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

    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null, 
      index: true
    },
    
    reason: { 
      type: String, 
      required: true, 
      trim: true 
    },
    
    description: { 
      type: String, 
      default: null 
    },

    status: { 
      type: String, 
      enum: ["pending", "resolved", "dismissed"], 
      default: "pending", 
      index: true 
    },
    
    processed_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      default: null 
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false
  }
);

reportSchema.index({ reason: "text" });

module.exports = mongoose.model("Report", reportSchema);