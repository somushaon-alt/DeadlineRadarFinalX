const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const userRoutes = require("./routes/users");
const deadlineRoutes = require("./routes/deadlines");

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/deadlines", deadlineRoutes);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);
  });

app.get("/", (req, res) => {
  res.json({
    message: "DeadlineRadar backend is running!"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});