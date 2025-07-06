// const mongoose = require("mongoose");

// const prizeSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   description: String,
//   value: String, // e.g., "$20 gift card", "3 packs drumstick chicken"
//   type: {
//     type: String,
//     enum: ['gift_card', 'food', 'points', 'other'],
//     default: 'other'
//   },
//   quantity: {
//     type: Number,
//     default: 1
//   },
//   availableForGames: [String],
//   isAwarded: {
//     type: Boolean,
//     default: false
//   },
//   awardedTo: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Player'
//   },
//   awardedAt: Date,
//   gameRound: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'GameRound'
//   }
// }, {
//   timestamps: true
// }); 

// // Export the Prize model
// export default mongoose.model("Prize", prizeSchema);