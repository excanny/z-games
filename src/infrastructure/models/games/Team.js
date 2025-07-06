import mongoose from "mongoose";

const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // References to standalone Player documents
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Calculate team totalPoints by summing player scores (requires populated players)
teamSchema.methods.updateTeamScore = async function () {
  if (this.populated('players')) {
    this.totalPoints = this.players.reduce((sum, p) => sum + (p.score || 0), 0);
  } else {
    // If not populated, populate first
    await this.populate('players');
    this.totalPoints = this.players.reduce((sum, p) => sum + (p.score || 0), 0);
  }
  return this.totalPoints;
};

// Rank players by score descending and update rank (requires populated players)
teamSchema.methods.rankPlayers = async function () {
  if (!this.populated('players')) {
    await this.populate('players');
  }
  
  // Sort players by score and update their rank
  const sortedPlayers = [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  for (let i = 0; i < sortedPlayers.length; i++) {
    sortedPlayers[i].rank = i + 1;
    await sortedPlayers[i].save();
  }
};

// Update each player's contributionPercentage within the team (requires populated players)
teamSchema.methods.updatePlayerContributionPercentages = async function () {
  if (!this.populated('players')) {
    await this.populate('players');
  }
  
  const total = this.totalPoints || 1; // avoid divide by zero
  
  for (const player of this.players) {
    player.contributionPercentage = ((player.score / total) * 100) || 0;
    await player.save();
  }
};

export default mongoose.model("Team", teamSchema);