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
  return await Game.find()
    .populate({
      path: 'participants',
      match: { isActive: true }, // or whatever field indicates active status
      select: 'name email isActive' // specify which player fields you want
    })
    .sort({ createdAt: -1 })
    .lean();
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

  /**
   * Add a new player to an active game
   * @param {String} gameId 
   * @param {Object} playerData - { name, avatar?, color? }
   * @param {Object} io - Socket.io instance for real-time updates
   * @returns {Object} The newly added participant
   */
  async addPlayerToGame(gameId, playerData, io) {
    const game = await Game.findById(gameId);
    if (!game) throw new Error("Game not found");

    // Check if player already exists
    const existingPlayer = game.participants.find(p => p.name === playerData.name);
    if (existingPlayer) {
      // If player exists but is inactive, reactivate them
      if (!existingPlayer.isActive) {
        existingPlayer.isActive = true;
        await game.save();
        
        // Emit update event
        io.emit('playerReactivated', { 
          gameId, 
          player: existingPlayer,
          message: `${playerData.name} has rejoined the game!`
        });
        io.emit('leaderboardUpdated', { gameId });
        
        return existingPlayer;
      } else {
        throw new Error("Player already exists and is active in this game");
      }
    }

    // Create new participant
    const newParticipant = {
      name: playerData.name,
      score: 0,
      isActive: true,
      avatar: playerData.avatar || null,
      color: playerData.color || null,
      joinedAt: new Date()
    };

    game.participants.push(newParticipant);
    await game.save();

    // Emit update events
    io.emit('playerAdded', { 
      gameId, 
      player: newParticipant,
      message: `${playerData.name} has joined the game!`
    });
    io.emit('leaderboardUpdated', { gameId });

    return newParticipant;
  }

  /**
 * Add multiple players to an active game in bulk
 * @param {String} gameId 
 * @param {Array} playersData - Array of player objects [{ name, avatar?, color? }, ...]
 * @param {Object} io - Socket.io instance for real-time updates
 * @returns {Object} Results object with added, reactivated, and failed players
 */
async addBulkPlayersToGame(gameId, playersData, io) {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");

  const results = {
    added: [],
    reactivated: [],
    failed: [],
    totalProcessed: playersData.length
  };

  // Process each player
  for (const playerData of playersData) {
    try {
      // Validate player data
      if (!playerData.name || typeof playerData.name !== 'string' || playerData.name.trim() === '') {
        results.failed.push({
          playerData,
          error: 'Player name is required and must be a non-empty string'
        });
        continue;
      }

      const playerName = playerData.name.trim();
      
      // Check if player already exists
      const existingPlayer = game.participants.find(p => p.name === playerName);
      
      if (existingPlayer) {
        // If player exists but is inactive, reactivate them
        if (!existingPlayer.isActive) {
          existingPlayer.isActive = true;
          existingPlayer.reactivatedAt = new Date();
          results.reactivated.push(existingPlayer);
        } else {
          // Player already exists and is active
          results.failed.push({
            playerData,
            error: 'Player already exists and is active in this game'
          });
        }
      } else {
        // Create new participant
        const newParticipant = {
          name: playerName,
          score: 0,
          isActive: true,
          avatar: playerData.avatar || null,
          color: playerData.color || null,
          joinedAt: new Date()
        };

        game.participants.push(newParticipant);
        results.added.push(newParticipant);
      }
    } catch (error) {
      results.failed.push({
        playerData,
        error: error.message
      });
    }
  }

  // Save all changes at once
  await game.save();

  // Emit update events for successful operations
  if (results.added.length > 0) {
    io.emit('bulkPlayersAdded', { 
      gameId, 
      players: results.added,
      message: `${results.added.length} new player(s) have joined the game!`
    });
  }

  if (results.reactivated.length > 0) {
    io.emit('bulkPlayersReactivated', { 
      gameId, 
      players: results.reactivated,
      message: `${results.reactivated.length} player(s) have rejoined the game!`
    });
  }

  // Always emit leaderboard update if any changes were made
  if (results.added.length > 0 || results.reactivated.length > 0) {
    io.emit('leaderboardUpdated', { gameId });
  }

  return results;
}

/**
 * Helper method to validate bulk player data before processing
 * @param {Array} playersData - Array of player objects
 * @returns {Object} Validation result with valid and invalid players
 */
validateBulkPlayerData(playersData) {
  if (!Array.isArray(playersData)) {
    throw new Error('Players data must be an array');
  }

  if (playersData.length === 0) {
    throw new Error('At least one player must be provided');
  }

  const validPlayers = [];
  const invalidPlayers = [];

  playersData.forEach((playerData, index) => {
    const validation = {
      index,
      playerData,
      errors: []
    };

    // Check if playerData is an object
    if (!playerData || typeof playerData !== 'object') {
      validation.errors.push('Player data must be an object');
    } else {
      // Check required fields
      if (!playerData.name) {
        validation.errors.push('Player name is required');
      } else if (typeof playerData.name !== 'string') {
        validation.errors.push('Player name must be a string');
      } else if (playerData.name.trim() === '') {
        validation.errors.push('Player name cannot be empty');
      }

      // Check optional fields
      if (playerData.avatar !== undefined && playerData.avatar !== null && typeof playerData.avatar !== 'string') {
        validation.errors.push('Player avatar must be a string or null');
      }

      if (playerData.color !== undefined && playerData.color !== null && typeof playerData.color !== 'string') {
        validation.errors.push('Player color must be a string or null');
      }
    }

    if (validation.errors.length === 0) {
      validPlayers.push(playerData);
    } else {
      invalidPlayers.push(validation);
    }
  });

  return {
    valid: validPlayers,
    invalid: invalidPlayers,
    hasErrors: invalidPlayers.length > 0
  };
}

  /**
   * Deactivate a player in a game (soft delete - keeps their data and scores)
   * @param {String} gameId 
   * @param {String} participantName 
   * @param {Object} io - Socket.io instance for real-time updates
   * @returns {Object} The deactivated participant
   */
  async deactivatePlayer(gameId, participantName, io) {
    const game = await Game.findById(gameId);
    if (!game) throw new Error("Game not found");

    const participant = game.participants.find(p => p.name === participantName);
    if (!participant) throw new Error("Participant not found");

    if (!participant.isActive) {
      throw new Error("Participant is already inactive");
    }

    // Deactivate the player (soft delete)
    participant.isActive = false;
    participant.deactivatedAt = new Date();

    await game.save();

    // Emit update events
    io.emit('playerDeactivated', { 
      gameId, 
      player: participant,
      message: `${participantName} has left the game`
    });
    io.emit('leaderboardUpdated', { gameId });

    return participant;
  }

  /**
   * Reactivate a previously deactivated player
   * @param {String} gameId 
   * @param {String} participantName 
   * @param {Object} io - Socket.io instance for real-time updates
   * @returns {Object} The reactivated participant
   */
  async reactivatePlayer(gameId, participantName, io) {
    const game = await Game.findById(gameId);
    if (!game) throw new Error("Game not found");

    const participant = game.participants.find(p => p.name === participantName);
    if (!participant) throw new Error("Participant not found");

    if (participant.isActive) {
      throw new Error("Participant is already active");
    }

    // Reactivate the player
    participant.isActive = true;
    participant.reactivatedAt = new Date();

    await game.save();

    // Emit update events
    io.emit('playerReactivated', { 
      gameId, 
      player: participant,
      message: `${participantName} has rejoined the game!`
    });
    io.emit('leaderboardUpdated', { gameId });

    return participant;
  }

  /**
   * Get all participants for a game (both active and inactive)
   * @param {String} gameId 
   * @returns {Array} All participants with their status
   */
  async getAllParticipants(gameId) {
    const game = await Game.findById(gameId).lean();
    if (!game) throw new Error("Game not found");

    return game.participants.map(p => ({
      name: p.name,
      score: p.score,
      isActive: p.isActive,
      avatar: p.avatar,
      color: p.color,
      joinedAt: p.joinedAt,
      deactivatedAt: p.deactivatedAt,
      reactivatedAt: p.reactivatedAt
    }));
  }

  async getLeaderboardForGame(gameId) {
    // Fetch the specific game
    const game = await Game.findById(gameId).lean();
    if (!game) throw new Error("Game not found");
  
    // Build sorted leaderboard from active participants
    const sortedParticipants = (game.participants || [])
      .filter(p => p.isActive)
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        name: p.name,
        score: p.score,
        avatar: p.avatar,
        color: p.color,
      }));
  
    // Get longest streak (your existing helper)
    const longestStreakInfo = this.getPlayerWithLongestStreakFromGame(game);
  
    // 🔑 Fetch last updated time for the entire Games collection
    const latestGame = await Game.findOne({})
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean();
    const lastGamesUpdateAt = latestGame ? latestGame.updatedAt : null;
  
    // Return full leaderboard response with last update datetime
    return {
      gameId: game._id,
      name: game.name,
      leaderboard: sortedParticipants,
      longestStreak: longestStreakInfo,
      lastGamesUpdateAt, // ⬅️ New field showing when any Game was last updated
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

    // Track streaks for each player
    const playerStreaks = {};
    
    // Initialize tracking for current streak
    let currentStreak = {
      player: null,
      length: 0,
      startIndex: -1
    };

    // Process each positive score event
    for (let i = 0; i < positiveScoreEvents.length; i++) {
      const event = positiveScoreEvents[i];
      const playerName = event.participantName;
      
      // Initialize player streak tracking if not exists
      if (!playerStreaks[playerName]) {
        playerStreaks[playerName] = {
          longestStreak: 0,
          currentStreak: 0,
          allStreaks: []
        };
      }
      
      if (currentStreak.player === playerName) {
        // Continue current streak for same player
        currentStreak.length++;
        playerStreaks[playerName].currentStreak++;
      } else {
        // End previous player's streak if it exists
        if (currentStreak.player !== null && currentStreak.length > 0) {
          const prevPlayer = currentStreak.player;
          
          // Record the completed streak
          const streakInfo = {
            length: currentStreak.length,
            startTime: positiveScoreEvents[currentStreak.startIndex].updatedAt,
            endTime: positiveScoreEvents[i - 1].updatedAt,
            startIndex: currentStreak.startIndex,
            endIndex: i - 1
          };
          
          playerStreaks[prevPlayer].allStreaks.push(streakInfo);
          
          // Update longest streak for previous player
          if (currentStreak.length > playerStreaks[prevPlayer].longestStreak) {
            playerStreaks[prevPlayer].longestStreak = currentStreak.length;
            playerStreaks[prevPlayer].bestStreak = streakInfo;
          }
          
          // Reset previous player's current streak
          playerStreaks[prevPlayer].currentStreak = 0;
          
          if (debug) {
            console.log(`Completed streak: ${prevPlayer} - ${currentStreak.length} consecutive scores`);
          }
        }
        
        // Start new streak for current player
        currentStreak = {
          player: playerName,
          length: 1,
          startIndex: i
        };
        playerStreaks[playerName].currentStreak = 1;
      }
    }

    // Handle the final streak (don't forget the last one!)
    if (currentStreak.player !== null && currentStreak.length > 0) {
      const finalPlayer = currentStreak.player;
      
      const streakInfo = {
        length: currentStreak.length,
        startTime: positiveScoreEvents[currentStreak.startIndex].updatedAt,
        endTime: positiveScoreEvents[positiveScoreEvents.length - 1].updatedAt,
        startIndex: currentStreak.startIndex,
        endIndex: positiveScoreEvents.length - 1
      };
      
      playerStreaks[finalPlayer].allStreaks.push(streakInfo);
      
      if (currentStreak.length > playerStreaks[finalPlayer].longestStreak) {
        playerStreaks[finalPlayer].longestStreak = currentStreak.length;
        playerStreaks[finalPlayer].bestStreak = streakInfo;
      }
      
      if (debug) {
        console.log(`Final streak: ${finalPlayer} - ${currentStreak.length} consecutive scores`);
      }
    }

    if (debug) {
      console.log('All player streaks:', playerStreaks);
    }

    // Find the player with the longest streak overall
    let maxStreakLength = 0;
    let streakKing = null;
    let bestStreakInfo = null;

    for (const [playerName, streakData] of Object.entries(playerStreaks)) {
      if (streakData.longestStreak > maxStreakLength) {
        maxStreakLength = streakData.longestStreak;
        streakKing = playerName;
        bestStreakInfo = streakData.bestStreak;
      } else if (streakData.longestStreak === maxStreakLength && maxStreakLength > 0) {
        // Tiebreaker: most recent streak start time wins
        const currentBestStartTime = bestStreakInfo ? new Date(bestStreakInfo.startTime) : new Date(0);
        const challengerStartTime = streakData.bestStreak ? new Date(streakData.bestStreak.startTime) : new Date(0);
        
        if (challengerStartTime > currentBestStartTime) {
          streakKing = playerName;
          bestStreakInfo = streakData.bestStreak;
        }
      }
    }

    if (debug) {
      console.log(`Streak King: ${streakKing} with ${maxStreakLength} consecutive positive scores`);
    }

    if (!streakKing || maxStreakLength === 0) {
      return null;
    }

    return {
      playerName: streakKing,
      longestStreak: maxStreakLength,
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

    // Check if participant is active
    if (!participant.isActive) {
      throw new Error("Cannot update score for inactive participant");
    }
  
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