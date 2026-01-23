const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    
    reporter_id: { 
      type: String, 
      required: true, 
      index: true 
    },
    
    post_id: { 
      type: String, 
      required: true, 
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
      type: String, 
      default: null 
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false
  }
);

// Hỗ trợ tìm kiếm nhanh nếu cần quản lý nhiều báo cáo
reportSchema.index({ reason: "text" });

module.exports = mongoose.model("Report", reportSchema);