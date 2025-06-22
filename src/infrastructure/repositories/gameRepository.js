const Game = require("../models/Game");

// Helper function to slugify game names
const slugify = name => name.toLowerCase().replace(/\s+/g, '-');

class GameRepository {
  async createGame(gameData) {
    const game = new Game(gameData);
    return await game.save();
  }

  async getGameById(id) {
    return await Game.findById(id).lean();
  }

  async getAllGames() {
    return await Game.find().sort({ createdAt: -1 }).lean();
  }  

  async updateGame(id, gameData) {
    return await Game.findByIdAndUpdate(id, gameData, { new: true });
  }

  async deactivateAllGames() {
    return await Game.updateMany({}, { isActive: false });
  }

  async getActiveGame() {
    return await Game.findOne({ isActive: true }).lean();
  }

  async getLeaderboardForGame(gameId) {
    const game = await Game.findById(gameId).lean();
    if (!game) throw new Error("Game not found");

    const sortedParticipants = (game.participants || [])
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        name: p.name,
        score: p.score,
        avatar: p.avatar,
        color: p.color,
      }));

    // Get the player with longest streak
    const longestStreakInfo = this.getPlayerWithLongestStreakFromGame(game);

    return {
      gameId: game._id,
      name: game.name,
      leaderboard: sortedParticipants,
      longestStreak: longestStreakInfo,
    };
  }

  async getPlayerWithLongestStreak(gameId) {
    const game = await Game.findById(gameId).lean();
    if (!game) throw new Error("Game not found");
    
    return this.getPlayerWithLongestStreakFromGame(game);
  }

  // Helper method to calculate longest streak from a game object
  getPlayerWithLongestStreakFromGame(game) {
    if (!game || !game.scoreLog || game.scoreLog.length === 0) {
      return null;
    }

    let longestStreak = 0;
    let longestPlayer = null;

    let currentPlayer = null;
    let currentStreak = 0;

    for (const event of game.scoreLog) {
      if (event.participantName === currentPlayer) {
        currentStreak++;
      } else {
        currentPlayer = event.participantName;
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestPlayer = currentPlayer;
      }
    }

    return {
      playerName: longestPlayer,
      longestStreak,
    };
  }

  /**
   * Update a participant's score by adding `scoreDelta`.
   * Also logs the update event in scoreLog.
   * @param {String} gameId 
   * @param {String} participantName 
   * @param {Number} scoreDelta 
   * @returns Updated participant object
   */
  async updatePlayerScore(gameId, participantName, scoreDelta) {
    const game = await Game.findById(gameId);
    if (!game) throw new Error("Game not found");

    const participant = game.participants.find(p => p.name === participantName);
    if (!participant) throw new Error("Participant not found");

    participant.score += scoreDelta;

    game.scoreLog.push({
      participantName,
      updatedAt: new Date(),
      // scoreChange: scoreDelta // optional, if you keep scoreChange in schema
    });

    await game.save();

    return participant;
  }
}

module.exports = GameRepository;