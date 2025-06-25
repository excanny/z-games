const Game = require("../models/Game");

class GameRepository {
  async createGame(gameData) {
    const game = new Game(gameData);
    return await game.save();
  }

  async getGameById(id) {
    return await Game.findById(id).lean();
  }

  async getGameByGameCode(gameCode) {
    return await Game.findOne({ gameCode }).lean();
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
      .filter(p => p.isActive) // ✅ Only include active participants
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        name: p.name,
        score: p.score,
        avatar: p.avatar,
        color: p.color,
      }));
  
    // Get the player with the longest streak (among all, or only active? Decide based on your logic)
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
  getPlayerWithLongestStreakFromGame(game, debug = false) {
    if (!game || !game.scoreLog || game.scoreLog.length === 0) {
      return null;
    }

    // Sort scoreLog by updatedAt to ensure chronological order
    const sortedScoreLog = [...game.scoreLog].sort((a, b) => 
      new Date(a.updatedAt) - new Date(b.updatedAt)
    );

    // Filter out negative scoring events (deductions) - only count positive scores for streaks
    const positiveScoreEvents = sortedScoreLog.filter(event => {
      // Only include events where scoreChange is positive (points gained, not lost)
      return event.scoreChange && event.scoreChange > 0;
    });

    if (debug) {
      console.log('All score events:', sortedScoreLog.map((event, i) => ({
        index: i,
        player: event.participantName,
        scoreChange: event.scoreChange,
        time: event.updatedAt,
      })));
      
      console.log('Positive score events:', positiveScoreEvents.map((event, i) => ({
        index: i,
        player: event.participantName,
        scoreChange: event.scoreChange,
        time: event.updatedAt,
      })));
    }

    if (positiveScoreEvents.length === 0) {
      return null;
    }

    // Track all streaks with their metadata
    const allStreaks = [];
    let currentPlayer = null;
    let currentStreak = 0;
    let streakStartIndex = 0;

    for (let i = 0; i < positiveScoreEvents.length; i++) {
      const event = positiveScoreEvents[i];
      
      if (event.participantName === currentPlayer) {
        // Continue current streak
        currentStreak++;
      } else {
        // Save the previous streak if it exists and has length > 0
        if (currentPlayer !== null && currentStreak > 0) {
          const streak = {
            playerName: currentPlayer,
            streakLength: currentStreak,
            startTime: positiveScoreEvents[streakStartIndex].updatedAt,
            endTime: positiveScoreEvents[i - 1].updatedAt,
            startIndex: streakStartIndex,
            endIndex: i - 1
          };
          allStreaks.push(streak);
          
          if (debug) {
            console.log(`Streak found: ${streak.playerName} - ${streak.streakLength} consecutive positive scores (started: ${streak.startTime}, ended: ${streak.endTime})`);
          }
        }
        
        // Start new streak
        currentPlayer = event.participantName;
        currentStreak = 1;
        streakStartIndex = i;
      }
    }

    // Don't forget the final streak
    if (currentPlayer !== null && currentStreak > 0) {
      const streak = {
        playerName: currentPlayer,
        streakLength: currentStreak,
        startTime: positiveScoreEvents[streakStartIndex].updatedAt,
        endTime: positiveScoreEvents[positiveScoreEvents.length - 1].updatedAt,
        startIndex: streakStartIndex,
        endIndex: positiveScoreEvents.length - 1
      };
      allStreaks.push(streak);
      
      if (debug) {
        console.log(`Final streak: ${streak.playerName} - ${streak.streakLength} consecutive positive scores (started: ${streak.startTime}, ended: ${streak.endTime})`);
      }
    }

    if (allStreaks.length === 0) {
      return null;
    }

    // Find the longest streak, with latest START time as tiebreaker (latest to achieve)
    const maxStreakLength = Math.max(...allStreaks.map(s => s.streakLength));
    const longestStreaks = allStreaks.filter(s => s.streakLength === maxStreakLength);
    
    if (debug) {
      console.log(`Max streak length: ${maxStreakLength}`);
      console.log('All longest streaks:', longestStreaks.map(s => ({
        player: s.playerName,
        length: s.streakLength,
        startTime: s.startTime,
        endTime: s.endTime
      })));
    }
    
    // Among streaks of equal length, pick the one that STARTED most recently (latest to achieve)
    const winner = longestStreaks.reduce((latest, current) => {
      return new Date(current.startTime) > new Date(latest.startTime) ? current : latest;
    });

    if (debug) {
      console.log('Winner:', {
        player: winner.playerName,
        length: winner.streakLength,
        startTime: winner.startTime,
        endTime: winner.endTime
      });
    }

    return {
      playerName: winner.playerName,
      longestStreak: winner.streakLength,
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
  async updatePlayerScore(gameId, participantName, scoreDelta, io) {
    debugger;
    const game = await Game.findById(gameId);
    if (!game) throw new Error("Game not found");
  
    const participant = game.participants.find(p => p.name === participantName);
    if (!participant) throw new Error("Participant not found");
  
    participant.score += scoreDelta;
  
    // Store the score change in the log
    game.scoreLog.push({
      participantName,
      scoreChange: scoreDelta,
      updatedAt: new Date(),
    });
  
    await game.save();
  
    // ✅ Emit leaderboard update event
    io.emit('leaderboardUpdated', { gameId });
  
    return participant;
  }
  
}

module.exports = GameRepository;