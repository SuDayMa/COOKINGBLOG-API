// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./routes/api");

const app = express();
app.use(cors());
app.use(express.json());

// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ DEBUG ENV (thêm)
console.log("✅ ENV MONGO_URI:", process.env.MONGO_URI ? "SET" : "MISSING");
console.log("✅ ENV PORT:", process.env.PORT);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch((e) => console.error("❌ Mongo error:", e.message));

app.use("/api", apiRoutes);

app.get("/", (req, res) => res.json({ ok: true, name: "CookingBlog API" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("🚀 Server running on port", port));
