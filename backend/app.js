const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models/index");

// Route Imports
const userRoutes = require("./routes/user.route");
const productRoutes = require("./routes/product.route");
const feedRoute = require("./routes/feed.route");
// const birthdayNotificationJob = require("./jobs/birthdayNotification.job");
const categoryRoutes = require("./routes/category.routes");
const reportRoutes = require("./routes/report.routes");


const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.json({ success: true, msg: "Maharaja API is running" }));

// Routes
app.use("/api/users",userRoutes);
app.use("/api/products",productRoutes);
app.use("/api/feeds", feedRoute);
app.use("/api/categories", categoryRoutes);
app.use("/api/reports", reportRoutes);

// birthdayNotificationJob();

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, msg: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, msg: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;

// Connect MySQL then start server
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ MySQL connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Firm Feed API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  });
