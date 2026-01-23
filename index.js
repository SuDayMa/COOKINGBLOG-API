const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./routes/index"); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((e) => console.error("❌ MongoDB Connection Error:", e.message));

app.get("/", (req, res) => res.json({ 
  ok: true, 
  name: "DailyCook API", 
  version: "1.0.0",
  environment: process.env.NODE_ENV || "development"
}));

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route không tồn tại" });
});

app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
  console.log(`👉 API Admin: http://localhost:${port}/api/admin`);
  console.log(`👉 API User: http://localhost:${port}/api`);
});