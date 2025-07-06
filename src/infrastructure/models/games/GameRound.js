// const mongoose = require("mongoose");

// const gameRoundSchema = new mongoose.Schema({
//   gameSession: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'GameSession',
//     required: true
//   },
//   gameDefinition: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'GameDefinition',
//     required: true
//   },
//   roundNumber: {
//     type: Number,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['waiting', 'active', 'completed'],
//     default: 'waiting'
//   },
//   participants: [{
//     player: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Player'
//     },
//     team: String,
//     participated: {
//       type: Boolean,
//       default: false
//     }
//   }],
//   results: {
//     winner: {
//       type: String, // 'Team1', 'Team2', or player ID for individual games
//     },
//     pointsAwarded: [{
//       player: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Player'
//       },
//       points: Number,
//       reason: String // 'win', 'bonus', 'penalty', 'superpower'
//     }],
//     prizesAwarded: [String]
//   },
//   gameSpecificData: {
//     // Charades specific
//     targetWord: String,
//     forbiddenWords: [String],
//     wordsRemoved: [String], // For Lion/Tiger superpowers
    
//     // Lemon Lemon specific
//     eliminationOrder: [{
//       player: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Player'
//       },
//       eliminatedAt: Date
//     }],
    
//     // Ball Pong specific
//     ballLandings: [{
//       player: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Player'
//       },
//       slot: Number,
//       points: Number,
//       prize: String
//     }],
    
//     // Dice specific
//     diceRolls: [{
//       player: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Player'
//       },
//       roll: Number,
//       challengeCompleted: Boolean,
//       pointsEarned: Number
//     }],
    
//     // Rubber Band specific
//     rubberBandCounts: [{
//       team: String,
//       count: Number
//     }],
    
//     // Basketball specific
//     shotResults: [{
//       player: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Player'
//       },
//       shots: [{
//         box: Number,
//         success: Boolean,
//         points: Number
//       }]
//     }]
//   },
//   superpowerUsages: [{
//     player: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Player'
//     },
//     animal: String,
//     effect: String,
//     usedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   startTime: Date,
//   endTime: Date,
//   notes: String
// }, {
//   timestamps: true
// });

// // Export the GameRound model
// export default mongoose.model("GameRound", gameRoundSchema);