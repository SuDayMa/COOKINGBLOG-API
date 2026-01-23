const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema(
  {
    id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },

    follower_id: { 
      type: String, 
      required: true, 
      index: true 
    },

    following_id: { 
      type: String, 
      required: true, 
      index: true 
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false 
  }
);


followerSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

module.exports = mongoose.model("Follower", followerSchema);