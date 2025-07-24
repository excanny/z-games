const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

function gamesMasterAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // Check role
    if (decoded.role !== "gamesMaster") {
      return res.status(403).json({ message: "Access denied: Not a games master" });
    }

    req.user = decoded; // optionally attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = gamesMasterAuth;
// This middleware checks if the user is a games master by verifying the JWT token.
// If the token is valid and the user has the "gamesMaster" role, it allows the request to proceed.