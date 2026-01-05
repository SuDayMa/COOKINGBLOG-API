const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs"); 
require("dotenv").config();

const apiRoutes = require("./routes/api");

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("Created uploads folder");
}

app.use("/uploads", express.static(uploadDir));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch((e) => console.error("Mongo error:", e.message));

app.get("/", (req, res) => res.json({ ok: true, name: "DailyCook API", version: "1.0.0" }));
app.use("/api", apiRoutes);


app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on http://localhost:" + port);
});