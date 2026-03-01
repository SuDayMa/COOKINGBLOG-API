const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },

    kind: { 
      type: String, 
      enum: [
        "post", "comment", "follow", "report", "like", 
        "post_approved", "post_rejected", "post_pending", 
        "warning" ,
        "system"
      ], 
      required: true 
    },

    actor_id: { 
      type: String, 
      required: false, 
    }, 

    recipient_id: { 
      type: String, 
      required: true, 
      index: true 
    },

    post_id: { type: String, default: null, index: true },
    comment_id: { type: String, default: null, index: true },

    post_title: { type: String, default: null },
    post_image: { type: String, default: null },

    content: { type: String, required: true }, 
    read: { type: Boolean, default: false },   
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false
  }
);

notificationSchema.index({ recipient_id: 1, created_at: -1 });

module.exports = mongoose.model("Notification", notificationSchema);