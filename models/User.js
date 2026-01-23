const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    
    name: { type: String, required: true, trim: true },
    
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    
    password: { 
      type: String, 
      required: true, 
      select: false 
    },

    avatar: { type: String, default: null },
    phone: { type: String, default: null },
    bio: { type: String, default: null },

    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user", 
      index: true 
    },

    is_blocked: { 
      type: Boolean, 
      default: false, 
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

userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

userSchema.index({ name: "text", email: "text" });

module.exports = mongoose.model("User", userSchema);