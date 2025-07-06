// const mongoose = require("mongoose");

// const monkeyDanceEventSchema = new mongoose.Schema({
//   gameSession: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'GameSession',
//     required: true
//   },
//   triggeredBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Player' // The monkey player
//   },
//   victims: [{
//     player: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Player'
//     },
//     pointsStolen: {
//       type: Number,
//       default: 5
//     }
//   }],
//   triggeredAt: {
//     type: Date,
//     default: Date.now
//   },
//   song: String
// }, {
//   timestamps: true
// });

// // Export the MonkeyDanceEvent model
// export default mongoose.model("MonkeyDanceEvent", monkeyDanceEventSchema);