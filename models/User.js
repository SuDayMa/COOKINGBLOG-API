// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "user" },

    // 🆕 Thêm số điện thoại
    phone: { type: String, default: "" },

    // 🆕 Avatar (chỉ lưu URL hoặc path file)
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
