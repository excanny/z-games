class PrizeRepository extends BaseRepository {
  constructor() {
    super(Prize);
  }

  async findAvailable(gameType = null) {
    try {
      const filter = { isAwarded: false };
      if (gameType) {
        filter.availableForGames = gameType;
      }
      return await this.model.find(filter);
    } catch (error) {
      throw new Error(`Error finding available prizes: ${error.message}`);
    }
  }

  async findAwarded() {
    try {
      return await this.model.find({ isAwarded: true })
        .populate('awardedTo', 'name')
        .populate('gameRound')
        .sort({ awardedAt: -1 });
    } catch (error) {
      throw new Error(`Error finding awarded prizes: ${error.message}`);
    }
  }

  async awardPrize(prizeId, playerId, gameRoundId) {
    try {
      return await this.model.findByIdAndUpdate(
        prizeId,
        {
          isAwarded: true,
          awardedTo: playerId,
          gameRound: gameRoundId,
          awardedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error awarding prize: ${error.message}`);
    }
  }

  async findByType(type) {
    try {
      return await this.model.find({ type });
    } catch (error) {
      throw new Error(`Error finding prizes by type: ${error.message}`);
    }
  }

  async findByGame(gameName) {
    try {
      return await this.model.find({ availableForGames: gameName });
    } catch (error) {
      throw new Error(`Error finding prizes by game: ${error.message}`);
    }
  }

  async initializePrizes(prizesData) {
    try {
      await this.model.deleteMany({});
      return await this.model.insertMany(prizesData);
    } catch (error) {
      throw new Error(`Error initializing prizes: ${error.message}`);
    }
  }

  async getRandomPrize(gameType = null) {
    try {
      const filter = { isAwarded: false, quantity: { $gt: 0 } };
      if (gameType) {
        filter.availableForGames = gameType;
      }
      
      const prizes = await this.model.find(filter);
      if (prizes.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * prizes.length);
      return prizes[randomIndex];
    } catch (error) {
      throw new Error(`Error getting random prize: ${error.message}`);
    }
  }
}

// Export the PrizeRepository class
export default PrizeRepository;