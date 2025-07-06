class PlayerRepository extends BaseRepository {
  constructor() {
    super(Player);
  }

  async findByName(name) {
    try {
      return await this.model.findOne({ name }).populate('animal');
    } catch (error) {
      throw new Error(`Error finding player by name: ${error.message}`);
    }
  }

  async findByTeam(team) {
    try {
      return await this.model.find({ team }).populate('animal');
    } catch (error) {
      throw new Error(`Error finding players by team: ${error.message}`);
    }
  }

  async findByAnimal(animalId) {
    try {
      return await this.model.find({ animal: animalId }).populate('animal');
    } catch (error) {
      throw new Error(`Error finding players by animal: ${error.message}`);
    }
  }

  async updatePoints(playerId, points, operation = 'add') {
    try {
      const updateQuery = operation === 'add' 
        ? { $inc: { totalPoints: points } }
        : { $set: { totalPoints: points } };
      
      return await this.model.findByIdAndUpdate(playerId, updateQuery, { new: true });
    } catch (error) {
      throw new Error(`Error updating player points: ${error.message}`);
    }
  }

  async addSuperpowerUsage(playerId, gameRoundId) {
    try {
      return await this.model.findByIdAndUpdate(
        playerId,
        {
          $push: {
            superpowerUsages: {
              gameRound: gameRoundId,
              usedAt: new Date()
            }
          }
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error adding superpower usage: ${error.message}`);
    }
  }

  async getSuperpowerUsageCount(playerId, gameSessionId) {
    try {
      const player = await this.model.findById(playerId).populate({
        path: 'superpowerUsages.gameRound',
        match: { gameSession: gameSessionId }
      });
      
      if (!player) return 0;
      
      return player.superpowerUsages.filter(usage => 
        usage.gameRound && usage.gameRound.gameSession.toString() === gameSessionId.toString()
      ).length;
    } catch (error) {
      throw new Error(`Error getting superpower usage count: ${error.message}`);
    }
  }

  async getLeaderboard() {
    try {
      return await this.model.find({})
        .populate('animal', 'name')
        .sort({ totalPoints: -1 });
    } catch (error) {
      throw new Error(`Error getting leaderboard: ${error.message}`);
    }
  }
}

// Export the PlayerRepository class
export default PlayerRepository;