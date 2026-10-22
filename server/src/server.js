const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const salesReportRoutes = require("./routes/salesReportRoutes");

const app = express();

//Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", salesReportRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "D Shawarma Station POS API is Running",
    timestamp: new Date().toISOString(),
  });
});

//Root Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to D Shawarma Station POS API",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`POS API running at http://localhost:${PORT}`);
  });
};

startServer();
