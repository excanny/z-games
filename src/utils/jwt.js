const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "your-secret-key";

module.exports = {
  sign: (payload, expiresIn = "1d") => jwt.sign(payload, SECRET, { expiresIn }),
  verify: (token) => jwt.verify(token, SECRET),
};
// This module provides functions to sign and verify JWT tokens.
// The `sign` function creates a token with a specified expiration time (default is 1 day).