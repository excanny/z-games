import { Schema, model } from "mongoose";

const animalSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'Lion', 'Tiger', 'Eagle', 'Cat', 'Shark', 'Dog', 'Whale', 'Horse',
      'Bison', 'Moose', 'Goose', 'Turtle', 'Beaver', 'Bear', 'Frog', 
      'Rabbit', 'Wolf', 'Human', 'Monkey', 'Chameleon'
    ]
  },
  superpower: {
    description: String,
    applicableGames: [String], // Games where this power can be used
    usageLimit: {
      type: Number,
      default: null // null means unlimited usage
    },
    specialRules: String
  }
}, {
  timestamps: true
});

export default model("Animal", animalSchema);