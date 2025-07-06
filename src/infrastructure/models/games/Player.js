import mongoose from 'mongoose';
const { Schema } = mongoose;

const playerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  animalAvatar: { 
    type: Schema.Types.ObjectId, 
    ref: 'Animal', 
    required: true 
  },
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }

}, {
  timestamps: true
});

export default mongoose.model("Player", playerSchema);
