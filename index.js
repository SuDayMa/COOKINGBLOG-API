// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const apiRoutes = require("./routes/api"); // gom lại 1 file

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch((e) => console.error("❌ Mongo error:", e.message));

app.use("/api", apiRoutes);

app.get("/", (req, res) => res.json({ ok: true, name: "CookingBlog API" }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("🚀 Server running on port", port));
