require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { swaggerUi, swaggerSpec } = require("./swagger");

// Import routes
const authRoutes = require("./src/infrastructure/routes/authRoutes");
const paymentRoutes = require("./src/infrastructure/routes/paymentRoutes"); // optional
const gameRoutes = require("./src/infrastructure/routes/gameRoutes"); // assuming you have or will create this

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes); // add this if you have game endpoints
// app.use("/api/payments", paymentRoutes); // uncomment when needed

// Swagger documentation route
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (req, res) => {
  res.send("🎮 Welcome to the Z Games API!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
