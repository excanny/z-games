import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

// Import routes
import authRoutes from "./src/infrastructure/routes/authRoutes.js";
import gameRoutes from "./src/infrastructure/routes/gameRoutes.js";
import tournamentRoutes from "./src/infrastructure/routes/tournamentRoutes.js";
import leaderboardScoringRoutes from "./src/infrastructure/routes/leaderboardScoringRoutes.js";


// Initialize Express app
const app = express();

// Create HTTP server (needed for Socket.IO)
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/leaderboardScoring", leaderboardScoringRoutes);
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