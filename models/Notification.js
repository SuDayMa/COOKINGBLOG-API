const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    kind: { 
      type: String, 
      enum: ["post", "comment", "follow", "report"], 
      required: true 
    },
    actor_id: { type: String, required: true, index: true }, 
    recipient_id: { type: String, required: true, index: true },
    post_id: { type: String, default: null, index: true },
    comment_id: { type: String, default: null, index: true },

    content: { type: String, required: true }, 
    read: { type: Boolean, default: false },   
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

module.exports = mongoose.model("Notification", notificationSchema);