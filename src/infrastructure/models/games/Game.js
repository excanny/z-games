import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['team', 'individual', 'general'],
    required: true
  },
  description: String,
  rules: [String],
  pointSystem: {
    winPoints: Number,
    bonusPoints: Number,
    penaltyPoints: Number,
    customRules: String
  },
  prizes: [String],
  timeLimit: Number, // in seconds
  maxPlayers: Number,
  minPlayers: Number,
  equipment: [String],
  applicableSuperpowers: [{
    animal: String,
    effect: String
  }]
}, {
  timestamps: true
});
// Export the GameDefinition model
export default mongoose.model("Game", gameSchema);