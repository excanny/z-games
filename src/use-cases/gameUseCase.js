class GameUseCase {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  async createGame({ name, gameType, participants }) {
    // Validate participants array contains objects with name, avatar, color
    if (!Array.isArray(participants) || participants.some(p => !p.name || !p.avatar || !p.color)) {
      throw new Error("Invalid participants data");
    }

    // Deactivate all games first
    await this.gameRepository.deactivateAllGames();

    // Create new game and set active
    return await this.gameRepository.createGame({ name, gameType, participants, isActive: true });
  }

  async getGameById(id) {
    return await this.gameRepository.getGameById(id);
  }

  async getGameByGameCode(gameCode) {
    return await this.gameRepository.getGameByGameCode(gameCode);
  }

  async getAllGames() {
    return await this.gameRepository.getAllGames();
  }

  async updateGame(id, gameData, io) {
    return await this.gameRepository.updateGame(id, gameData, io);
  }

  async getActiveGame() {
    return await this.gameRepository.getActiveGame();
  }

  /**
   * Add a new player to an active game
   * @param {String} gameId 
   * @param {Object} playerData - { name, avatar?, color? }
   * @param {Object} io - Socket.io instance
   * @returns {Object} The added participant
   */
  async addPlayerToGame(gameId, playerData, io) {
    // Validate required player data
    if (!playerData || !playerData.name) {
      throw new Error("Player name is required");
    }

    // Validate player name length and characters
    if (playerData.name.trim().length === 0) {
      throw new Error("Player name cannot be empty");
    }

    if (playerData.name.length > 50) {
      throw new Error("Player name must be 50 characters or less");
    }

    // Clean the player data
    const cleanPlayerData = {
      name: playerData.name.trim(),
      avatar: playerData.avatar || null,
      color: playerData.color || null
    };

    return await this.gameRepository.addPlayerToGame(gameId, cleanPlayerData, io);
  }

  /**
   * Add multiple players to an active game in bulk
   * @param {String} gameId 
   * @param {Array} playersData - Array of player objects [{ name, avatar?, color? }, ...]
   * @param {Object} io - Socket.io instance
   * @returns {Object} Results object with added, reactivated, and failed players
   */
  async addBulkPlayersToGame(gameId, playersData, io) {
    // Validate game ID
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    // Validate and clean players data using repository's validation method
    const validation = this.gameRepository.validateBulkPlayerData(playersData);
    
    if (validation.hasErrors) {
      // If there are validation errors, we can either throw or return them
      // For better UX, let's include validation errors in the response
      const validationErrors = validation.invalid.map(invalid => ({
        playerData: invalid.playerData,
        error: invalid.errors.join('; ')
      }));
      
      // If no valid players, throw error
      if (validation.valid.length === 0) {
        throw new Error(`No valid players to add. Validation errors: ${JSON.stringify(validationErrors)}`);
      }
    }

    // Clean the valid player data
    const cleanPlayersData = validation.valid.map(playerData => ({
      name: playerData.name.trim(),
      avatar: playerData.avatar || null,
      color: playerData.color || null
    }));

    // Validate player name lengths
    const nameValidationErrors = [];
    cleanPlayersData.forEach((playerData, index) => {
      if (playerData.name.length > 50) {
        nameValidationErrors.push({
          playerData,
          error: "Player name must be 50 characters or less"
        });
      }
    });

    // Filter out players with name length issues
    const validPlayers = cleanPlayersData.filter(playerData => playerData.name.length <= 50);
    
    if (validPlayers.length === 0) {
      throw new Error("No valid players to add after name length validation");
    }

    // Add valid players in bulk
    const results = await this.gameRepository.addBulkPlayersToGame(gameId, validPlayers, io);

    // Include any validation errors in the response
    if (validation.hasErrors || nameValidationErrors.length > 0) {
      const allValidationErrors = [
        ...validation.invalid.map(invalid => ({
          playerData: invalid.playerData,
          error: invalid.errors.join('; ')
        })),
        ...nameValidationErrors
      ];
      
      results.failed = [...(results.failed || []), ...allValidationErrors];
    }

    return results;
  }

  /**
   * Remove a player from an active game (soft delete)
   * @param {String} gameId 
   * @param {String} participantName 
   * @param {Object} io - Socket.io instance
   * @returns {Object} The deactivated participant
   */
  async removePlayerFromGame(gameId, participantName, io) {
    if (!participantName || participantName.trim().length === 0) {
      throw new Error("Participant name is required");
    }

    return await this.gameRepository.deactivatePlayer(gameId, participantName.trim(), io);
  }

  /**
   * Reactivate a previously removed player
   * @param {String} gameId 
   * @param {String} participantName 
   * @param {Object} io - Socket.io instance
   * @returns {Object} The reactivated participant
   */
  async reactivatePlayer(gameId, participantName, io) {
    if (!participantName || participantName.trim().length === 0) {
      throw new Error("Participant name is required");
    }

    return await this.gameRepository.reactivatePlayer(gameId, participantName.trim(), io);
  }

  /**
   * Get all participants for a game (active and inactive)
   * @param {String} gameId 
   * @returns {Array} All participants with their status
   */
  async getAllParticipants(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    return await this.gameRepository.getAllParticipants(gameId);
  }

  /**
   * Get only active participants for a game
   * @param {String} gameId 
   * @returns {Array} Active participants only
   */
  async getActiveParticipants(gameId) {
    const allParticipants = await this.getAllParticipants(gameId);
    return allParticipants.filter(p => p.isActive);
  }

  /**
   * Get only inactive participants for a game
   * @param {String} gameId 
   * @returns {Array} Inactive participants only
   */
  async getInactiveParticipants(gameId) {
    const allParticipants = await this.getAllParticipants(gameId);
    return allParticipants.filter(p => !p.isActive);
  }

  /**
   * Check if a player exists in a game (active or inactive)
   * @param {String} gameId 
   * @param {String} participantName 
   * @returns {Object|null} Participant if found, null otherwise
   */
  async findParticipant(gameId, participantName) {
    if (!participantName || participantName.trim().length === 0) {
      return null;
    }

    const allParticipants = await this.getAllParticipants(gameId);
    return allParticipants.find(p => p.name === participantName.trim()) || null;
  }

  /**
   * Update participant's score by a delta, logs the update internally.
   * This delegates to GameRepository for proper logging.
   * @param {String} gameId
   * @param {String} participantName
   * @param {Number} scoreDelta (can be positive or negative)
   * @param {Object} io - Socket.io instance
   */
  async updateParticipantScore(gameId, participantName, scoreDelta, io) {
    // Validate inputs
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!participantName || participantName.trim().length === 0) {
      throw new Error("Participant name is required");
    }

    if (typeof scoreDelta !== 'number' || isNaN(scoreDelta)) {
      throw new Error("Score delta must be a valid number");
    }

    // Delegate to repository which updates score and logs event
    return await this.gameRepository.updatePlayerScore(gameId, participantName.trim(), scoreDelta, io);
  }

  async getLeaderboardForGame(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    // Now delegate to the repository which includes longest streak
    return await this.gameRepository.getLeaderboardForGame(gameId);
  }

  /**
   * Get the player with the longest streak for a game
   * @param {String} gameId 
   * @returns {Object|null} Player with longest streak info
   */
  async getPlayerWithLongestStreak(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    return await this.gameRepository.getPlayerWithLongestStreak(gameId);
  }

  /**
   * Get game statistics including player counts
   * @param {String} gameId 
   * @returns {Object} Game statistics
   */
  async getGameStats(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const game = await this.getGameById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const allParticipants = await this.getAllParticipants(gameId);
    const activeParticipants = allParticipants.filter(p => p.isActive);
    const inactiveParticipants = allParticipants.filter(p => !p.isActive);

    return {
      gameId: game._id,
      gameName: game.name,
      gameType: game.gameType,
      isActive: game.isActive,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
      totalParticipants: allParticipants.length,
      activeParticipants: activeParticipants.length,
      inactiveParticipants: inactiveParticipants.length,
      totalScoreEvents: game.scoreLog ? game.scoreLog.length : 0,
      averageScore: activeParticipants.length > 0 
        ? Math.round(activeParticipants.reduce((sum, p) => sum + p.score, 0) / activeParticipants.length)
        : 0,
      highestScore: activeParticipants.length > 0 
        ? Math.max(...activeParticipants.map(p => p.score))
        : 0,
      lowestScore: activeParticipants.length > 0 
        ? Math.min(...activeParticipants.map(p => p.score))
        : 0
    };
  }

  /**
   * Validate bulk player data before processing
   * @param {Array} playersData - Array of player objects
   * @returns {Object} Validation result with valid and invalid players
   */
  validateBulkPlayerData(playersData) {
    return this.gameRepository.validateBulkPlayerData(playersData);
  }
}

export default GameUseCase;