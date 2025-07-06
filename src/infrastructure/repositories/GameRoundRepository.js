class GameRoundRepository extends BaseRepository {
  constructor() {
    super(GameRound);
  }

  async findBySession(sessionId) {
    try {
      return await this.model.find({ gameSession: sessionId })
        .populate('gameDefinition', 'name type')
        .sort({ roundNumber: 1 });
    } catch (error) {
      throw new Error(`Error finding rounds by session: ${error.message}`);
    }
  }

  async findActiveRound(sessionId) {
    try {
      return await this.model.findOne({
        gameSession: sessionId,
        status: 'active'
      }).populate('gameDefinition');
    } catch (error) {
      throw new Error(`Error finding active round: ${error.message}`);
    }
  }

  async findByGameType(gameType) {
    try {
      return await this.model.find({})
        .populate({
          path: 'gameDefinition',
          match: { type: gameType }
        })
        .then(rounds => rounds.filter(round => round.gameDefinition));
    } catch (error) {
      throw new Error(`Error finding rounds by game type: ${error.message}`);
    }
  }

  async updateStatus(roundId, status) {
    try {
      const updateData = { status };
      if (status === 'active') {
        updateData.startTime = new Date();
      } else if (status === 'completed') {
        updateData.endTime = new Date();
      }

      return await this.model.findByIdAndUpdate(roundId, updateData, { new: true });
    } catch (error) {
      throw new Error(`Error updating round status: ${error.message}`);
    }
  }

  async addParticipant(roundId, playerId, team) {
    try {
      return await this.model.findByIdAndUpdate(
        roundId,
        {
          $addToSet: {
            participants: {
              player: playerId,
              team: team,
              participated: false
            }
          }
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error adding participant: ${error.message}`);
    }
  }

  async markParticipation(roundId, playerId) {
    try {
      return await this.model.findOneAndUpdate(
        {
          _id: roundId,
          'participants.player': playerId
        },
        {
          $set: { 'participants.$.participated': true }
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error marking participation: ${error.message}`);
    }
  }

  async addPointsAwarded(roundId, playerId, points, reason) {
    try {
      return await this.model.findByIdAndUpdate(
        roundId,
        {
          $push: {
            'results.pointsAwarded': {
              player: playerId,
              points: points,
              reason: reason
            }
          }
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error adding points awarded: ${error.message}`);
    }
  }

  async setWinner(roundId, winner) {
    try {
      return await this.model.findByIdAndUpdate(
        roundId,
        { 'results.winner': winner },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error setting winner: ${error.message}`);
    }
  }

  async addSuperpowerUsage(roundId, playerId, animal, effect) {
    try {
      return await this.model.findByIdAndUpdate(
        roundId,
        {
          $push: {
            superpowerUsages: {
              player: playerId,
              animal: animal,
              effect: effect,
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

  async updateGameSpecificData(roundId, gameData) {
    try {
      return await this.model.findByIdAndUpdate(
        roundId,
        { $set: { gameSpecificData: gameData } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error updating game specific data: ${error.message}`);
    }
  }

  async getCompletedRounds(sessionId) {
    try {
      return await this.model.find({
        gameSession: sessionId,
        status: 'completed'
      })
      .populate('gameDefinition', 'name')
      .populate('results.pointsAwarded.player', 'name')
      .sort({ roundNumber: 1 });
    } catch (error) {
      throw new Error(`Error getting completed rounds: ${error.message}`);
    }
  }
}

// Export the GameRoundRepository class
export default GameRoundRepository;