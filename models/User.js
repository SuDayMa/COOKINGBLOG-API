// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // dùng passwordHash, không dùng password thuần
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: "user" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
