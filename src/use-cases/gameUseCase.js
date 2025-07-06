class GameUseCase {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Create a new game with comprehensive configuration
   * @param {Object} gameData - Complete game configuration
   * @returns {Object} Created game
   */
  async createGame(gameData) {
    // Validate required fields
    if (!gameData.name || !gameData.category || !gameData.description || !gameData.gameType) {
      throw new Error("Name, category, description, and gameType are required");
    }

    // Validate enums
    const validCategories = [
      'word_game', 'physical_game', 'skill_game', 'party_game', 
      'elimination_game', 'team_game', 'individual_game', 'social_deduction'
    ];
    const validGameTypes = ['competitive', 'cooperative', 'elimination', 'scoring', 'social'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    if (!validCategories.includes(gameData.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    if (!validGameTypes.includes(gameData.gameType)) {
      throw new Error(`Invalid gameType. Must be one of: ${validGameTypes.join(', ')}`);
    }

    if (gameData.difficulty && !validDifficulties.includes(gameData.difficulty)) {
      throw new Error(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
    }

    // Set defaults
    const gameWithDefaults = {
      ...gameData,
      isActive: true,
      difficulty: gameData.difficulty || 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.gameRepository.createGame(gameWithDefaults);
  }

  async getGameById(id) {
    if (!id) {
      throw new Error("Game ID is required");
    }
    return await this.gameRepository.getGameById(id);
  }

  async getGameByName(name) {
    if (!name) {
      throw new Error("Game name is required");
    }
    return await this.gameRepository.getGameByName(name);
  }

  async getAllGames() {
    return await this.gameRepository.getAllGames();
  }

  async updateGame(id, gameData) {
    if (!id) {
      throw new Error("Game ID is required");
    }
    return await this.gameRepository.updateGame(id, gameData);
  }

  async deactivateGame(id) {
    if (!id) {
      throw new Error("Game ID is required");
    }
    return await this.gameRepository.deactivateGame(id);
  }

  async getActiveGames() {
    return await this.gameRepository.getActiveGames();
  }

  /**
   * Search games with multiple filters
   * @param {Object} filters - Search criteria
   * @returns {Array} Matching games
   */
  async searchGames(filters = {}) {
    const { 
      searchTerm, 
      category, 
      difficulty, 
      gameType, 
      playerCount, 
      maxDuration, 
      minAge, 
      maxAge, 
      teamBased, 
      tags,
      equipmentAvailable 
    } = filters;

    let games = await this.getAllGames();

    // Apply filters
    if (searchTerm) {
      const searchResults = await this.gameRepository.searchGames(searchTerm);
      const searchIds = searchResults.map(g => g._id.toString());
      games = games.filter(g => searchIds.includes(g._id.toString()));
    }

    if (category) {
      games = games.filter(g => g.category === category);
    }

    if (difficulty) {
      games = games.filter(g => g.difficulty === difficulty);
    }

    if (gameType) {
      games = games.filter(g => g.gameType === gameType);
    }

    if (playerCount) {
      games = games.filter(g => {
        const minPlayers = g.teamConfiguration?.minPlayers || 1;
        const maxPlayers = g.teamConfiguration?.maxPlayers;
        return playerCount >= minPlayers && (maxPlayers === null || playerCount <= maxPlayers);
      });
    }

    if (maxDuration) {
      games = games.filter(g => {
        const duration = g.duration?.estimatedMinutes;
        return !duration || duration <= maxDuration;
      });
    }

    if (minAge !== undefined || maxAge !== undefined) {
      games = games.filter(g => {
        const gameMinAge = g.ageRating?.minAge;
        const gameMaxAge = g.ageRating?.maxAge;
        
        if (minAge !== undefined && gameMinAge && minAge < gameMinAge) return false;
        if (maxAge !== undefined && gameMaxAge && maxAge > gameMaxAge) return false;
        
        return true;
      });
    }

    if (teamBased !== undefined) {
      games = games.filter(g => g.teamConfiguration?.teamBased === teamBased);
    }

    if (tags && tags.length > 0) {
      games = games.filter(g => 
        g.tags && g.tags.some(tag => tags.includes(tag))
      );
    }

    if (equipmentAvailable && equipmentAvailable.length > 0) {
      games = games.filter(g => {
        if (!g.equipment || g.equipment.length === 0) return true;
        
        return g.equipment.every(eq => 
          eq.optional || equipmentAvailable.includes(eq.item)
        );
      });
    }

    return games;
  }

  /**
   * Get game recommendations based on criteria
   * @param {Object} criteria - Recommendation criteria
   * @returns {Array} Recommended games
   */
  async getGameRecommendations(criteria = {}) {
    const { playerCount, availableTime, preferredDifficulty, age, teamPreference } = criteria;

    let recommendations = await this.getAllGames();

    // Score each game based on criteria match
    recommendations = recommendations.map(game => {
      let score = 0;

      // Player count match
      if (playerCount) {
        const minPlayers = game.teamConfiguration?.minPlayers || 1;
        const maxPlayers = game.teamConfiguration?.maxPlayers;
        if (playerCount >= minPlayers && (maxPlayers === null || playerCount <= maxPlayers)) {
          score += 10;
        }
      }

      // Time match
      if (availableTime && game.duration?.estimatedMinutes) {
        if (game.duration.estimatedMinutes <= availableTime) {
          score += 8;
          // Bonus for games that use most of available time
          const timeUtilization = game.duration.estimatedMinutes / availableTime;
          if (timeUtilization > 0.7) score += 2;
        }
      }

      // Difficulty preference
      if (preferredDifficulty && game.difficulty === preferredDifficulty) {
        score += 5;
      }

      // Age appropriateness
      if (age) {
        const gameMinAge = game.ageRating?.minAge;
        const gameMaxAge = game.ageRating?.maxAge;
        if ((!gameMinAge || age >= gameMinAge) && (!gameMaxAge || age <= gameMaxAge)) {
          score += 3;
        }
      }

      // Team preference
      if (teamPreference !== undefined) {
        const isTeamGame = game.teamConfiguration?.teamBased || false;
        if (isTeamGame === teamPreference) {
          score += 6;
        }
      }

      return { ...game, recommendationScore: score };
    });

    // Filter out games with 0 score and sort by score
    return recommendations
      .filter(game => game.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Get games by category
   * @param {String} category - Game category
   * @returns {Array} Games in category
   */
  async getGamesByCategory(category) {
    if (!category) {
      throw new Error("Category is required");
    }
    return await this.gameRepository.getGamesByCategory(category);
  }

  /**
   * Get team-based games
   * @returns {Array} Team games
   */
  async getTeamGames() {
    return await this.gameRepository.getTeamGames();
  }

  /**
   * Get games by difficulty
   * @param {String} difficulty - Game difficulty
   * @returns {Array} Games with specified difficulty
   */
  async getGamesByDifficulty(difficulty) {
    if (!difficulty) {
      throw new Error("Difficulty is required");
    }
    return await this.gameRepository.getGamesByDifficulty(difficulty);
  }

  /**
   * Get age-appropriate games
   * @param {Number} age - Player age
   * @returns {Array} Age-appropriate games
   */
  async getGamesByAge(age) {
    if (!age || age < 0) {
      throw new Error("Valid age is required");
    }
    return await this.gameRepository.getGamesByAge(age);
  }

  /**
   * Get games suitable for player count
   * @param {Number} playerCount - Number of players
   * @returns {Array} Suitable games
   */
  async getGamesByPlayerCount(playerCount) {
    if (!playerCount || playerCount < 1) {
      throw new Error("Valid player count is required");
    }
    return await this.gameRepository.getGamesByPlayerCount(playerCount);
  }

  /**
   * Get games by duration
   * @param {Number} availableMinutes - Available time in minutes
   * @returns {Array} Games that fit in time
   */
  async getGamesByDuration(availableMinutes) {
    if (!availableMinutes || availableMinutes < 1) {
      throw new Error("Valid duration is required");
    }
    return await this.gameRepository.getGamesByDuration(availableMinutes);
  }

  /**
   * Get games by equipment availability
   * @param {Array} availableEquipment - Available equipment
   * @returns {Array} Playable games
   */
  async getGamesByEquipment(availableEquipment = []) {
    return await this.gameRepository.getGamesByEquipment(availableEquipment);
  }

  /**
   * Add animal superpower to a game
   * @param {String} gameId - Game ID
   * @param {Object} superpowerData - Superpower configuration
   * @returns {Object} Updated game
   */
  async addAnimalSuperpower(gameId, superpowerData) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    // Validate superpower data
    const validAnimals = [
      'Lion', 'Tiger', 'Eagle', 'Cat', 'Shark', 'Dog', 'Whale', 'Horse',
      'Bison', 'Moose', 'Goose', 'Turtle', 'Beaver', 'Bear', 'Frog', 
      'Rabbit', 'Wolf', 'Human', 'Monkey', 'Chameleon'
    ];

    if (!superpowerData.animal || !validAnimals.includes(superpowerData.animal)) {
      throw new Error(`Invalid animal. Must be one of: ${validAnimals.join(', ')}`);
    }

    if (!superpowerData.power) {
      throw new Error("Power description is required");
    }

    return await this.gameRepository.addAnimalSuperpower(gameId, superpowerData);
  }

  /**
   * Get applicable superpowers for a game
   * @param {String} gameId - Game ID
   * @returns {Array} Applicable superpowers
   */
  async getGameSuperpowers(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }
    return await this.gameRepository.getGameSuperpowers(gameId);
  }

  /**
   * Add equipment to a game
   * @param {String} gameId - Game ID
   * @param {Object} equipmentData - Equipment configuration
   * @returns {Object} Updated game
   */
  async addGameEquipment(gameId, equipmentData) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!equipmentData.item) {
      throw new Error("Equipment item name is required");
    }

    const cleanEquipmentData = {
      item: equipmentData.item,
      quantity: equipmentData.quantity || 1,
      optional: equipmentData.optional || false
    };

    return await this.gameRepository.addGameEquipment(gameId, cleanEquipmentData);
  }

  /**
   * Add prize to a game
   * @param {String} gameId - Game ID
   * @param {Object} prizeData - Prize configuration
   * @returns {Object} Updated game
   */
  async addGamePrize(gameId, prizeData) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const validPrizeTypes = ['points', 'gift_card', 'physical_item', 'food', 'privilege'];

    if (!prizeData.type || !validPrizeTypes.includes(prizeData.type)) {
      throw new Error(`Invalid prize type. Must be one of: ${validPrizeTypes.join(', ')}`);
    }

    if (!prizeData.value) {
      throw new Error("Prize value is required");
    }

    return await this.gameRepository.addGamePrize(gameId, prizeData);
  }

  /**
   * Update game rules
   * @param {String} gameId - Game ID
   * @param {Array} rules - Array of rule objects
   * @returns {Object} Updated game
   */
  async updateGameRules(gameId, rules) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!Array.isArray(rules)) {
      throw new Error("Rules must be an array");
    }

    // Validate rules structure
    const validatedRules = rules.map((rule, index) => ({
      title: rule.title || `Rule ${index + 1}`,
      description: rule.description || '',
      order: rule.order || index + 1
    }));

    return await this.gameRepository.updateGameRules(gameId, validatedRules);
  }

  /**
   * Update game scoring system
   * @param {String} gameId - Game ID
   * @param {Object} scoringSystem - Scoring configuration
   * @returns {Object} Updated game
   */
  async updateScoringSystem(gameId, scoringSystem) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const validScoringMethods = ['fixed', 'variable', 'elimination', 'accumulative', 'position_based'];

    if (scoringSystem.scoringMethod && !validScoringMethods.includes(scoringSystem.scoringMethod)) {
      throw new Error(`Invalid scoring method. Must be one of: ${validScoringMethods.join(', ')}`);
    }

    return await this.gameRepository.updateScoringSystem(gameId, scoringSystem);
  }

  /**
   * Get game variants
   * @param {String} gameId - Game ID
   * @returns {Array} Game variants
   */
  async getGameVariants(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }
    return await this.gameRepository.getGameVariants(gameId);
  }

  /**
   * Add game variant
   * @param {String} gameId - Game ID
   * @param {Object} variantData - Variant configuration
   * @returns {Object} Updated game
   */
  async addGameVariant(gameId, variantData) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!variantData.name) {
      throw new Error("Variant name is required");
    }

    return await this.gameRepository.addGameVariant(gameId, variantData);
  }

  /**
   * Get related games
   * @param {String} gameId - Game ID
   * @returns {Array} Related games
   */
  async getRelatedGames(gameId) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }
    return await this.gameRepository.getRelatedGames(gameId);
  }

  /**
   * Get game statistics
   * @returns {Object} Overall game statistics
   */
  async getGameStatistics() {
    return await this.gameRepository.getGameStatistics();
  }

  /**
   * Get games with media references
   * @returns {Array} Games with media
   */
  async getGamesWithMedia() {
    return await this.gameRepository.getGamesWithMedia();
  }

  /**
   * Add media reference to game
   * @param {String} gameId - Game ID
   * @param {Object} mediaData - Media reference data
   * @returns {Object} Updated game
   */
  async addMediaReference(gameId, mediaData) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const validMediaTypes = ['video', 'image', 'audio', 'link'];

    if (!mediaData.type || !validMediaTypes.includes(mediaData.type)) {
      throw new Error(`Invalid media type. Must be one of: ${validMediaTypes.join(', ')}`);
    }

    if (!mediaData.url) {
      throw new Error("Media URL is required");
    }

    return await this.gameRepository.addMediaReference(gameId, mediaData);
  }

  /**
   * Manage game tags
   * @param {String} gameId - Game ID
   * @param {Array} tags - Tags to add
   * @returns {Object} Updated game
   */
  async addGameTags(gameId, tags) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error("Tags must be a non-empty array");
    }

    return await this.gameRepository.addGameTags(gameId, tags);
  }

  /**
   * Remove game tags
   * @param {String} gameId - Game ID
   * @param {Array} tags - Tags to remove
   * @returns {Object} Updated game
   */
  async removeGameTags(gameId, tags) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error("Tags must be a non-empty array");
    }

    return await this.gameRepository.removeGameTags(gameId, tags);
  }

  /**
   * Get games by tags
   * @param {Array} tags - Tags to search for
   * @returns {Array} Games with matching tags
   */
  async getGamesByTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error("Tags must be a non-empty array");
    }
    return await this.gameRepository.getGamesByTags(tags);
  }
}

export default GameUseCase;