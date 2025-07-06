// import mongoose from 'mongoose';
// const { Schema } = mongoose;

// const playerRankingSchema = new Schema({
//   rank: { type: Number, required: true },
//   playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
//   playerName: { type: String, required: true },
//   individualScore: { type: Number, default: 0 },
//   contributionPercentage: { type: Number, default: 0 },
//   trend: { 
//     type: String, 
//     enum: ['up', 'down', 'stable'], 
//     default: 'stable' 
//   }
// }, { _id: false });

// // Team Ranking Schema
// const teamRankingSchema = new Schema({
//   rank: { type: Number, required: true },
//   teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
//   teamName: { type: String, required: true },
//   totalScore: { type: Number, default: 0 },
//   averageScore: { type: Number, default: 0 },
//   gamesPlayed: { type: Number, default: 0 },
//   trend: { 
//     type: String, 
//     enum: ['up', 'down', 'stable'], 
//     default: 'stable' 
//   },
//   playerRankings: [playerRankingSchema]
// }, { _id: false });


// //// Export the TeamRanking model
// export default mongoose.model("TeamRanking", teamRankingSchema);