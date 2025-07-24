// // src/infrastructure/models/SeedingTracker.js
// import mongoose from 'mongoose';

// const seedingTrackerSchema = new mongoose.Schema({
//   seedType: {
//     type: String,
//     required: true,
//     unique: true,
//     enum: ['animals', 'games', 'master']
//   },
//   lastSeededAt: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   version: {
//     type: String,
//     required: true,
//     default: '1.0.0'
//   },
//   itemsSeeded: {
//     type: Number,
//     required: true,
//     default: 0
//   },
//   status: {
//     type: String,
//     enum: ['completed', 'in_progress', 'failed'],
//     default: 'completed'
//   },
//   expectedItems: [{
//     name: String,
//     type: String,
//     checksum: String // For detecting data changes
//   }]
// }, {
//   timestamps: true
// });

// const SeedingTracker = mongoose.model('SeedingTracker', seedingTrackerSchema);

// export default SeedingTracker;