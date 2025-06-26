require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");          // <-- Required for Socket.IO
const socketIO = require("socket.io"); // <-- Socket.IO import
const connectDB = require("./src/config/db");
const { swaggerUi, swaggerSpec } = require("./swagger");

// Import routes
const authRoutes = require("./src/infrastructure/routes/authRoutes");
const gameRoutes = require("./src/infrastructure/routes/gameRoutes");

// Initialize Express app
const app = express();

// Create HTTP server (needed for Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    //origin: "http://localhost:5174",
    origin: "https://z-games.onrender.com",
    methods: ["GET", "POST", "PATCH"],
  },
});

// Make io accessible in routes / controllers
app.set("io", io);

// Example socket.io event
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
// app.use("/api/payments", paymentRoutes); // Uncomment if needed

// Swagger docs
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (req, res) => {
  res.send("🎮 Welcome to the Z Games API!");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
