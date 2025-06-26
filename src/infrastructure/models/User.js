const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
}, { timestamps: true });  // ✅ This handles both createdAt and updatedAt automatically

module.exports = mongoose.model("User", UserSchema);
