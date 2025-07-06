import BaseRepository from './BaseRepository.js';
import Game from '../models/games/Game.js';

class GameRepository extends BaseRepository {
  constructor() {
    super(Game);
  }

  /**
 * Find a game by ID
 * @param {string} id - Game ID
 * @returns {Promise<Object|null>} Game object or null if not found
 */
async findById(id) {
  try {
    return await this.model.findById(id);
  } catch (error) {
    throw new Error(`Error finding game by ID: ${error.message}`);
  }
}


  /**
   * Find a game definition by name
   * @param {string} name - The name of the game
   * @returns {Promise<Object|null>} Game definition or null if not found
   */
  async findByName(name) {
    try {
      return await this.model.findOne({ name });
    } catch (error) {
      throw new Error(`Error finding game definition by name: ${error.message}`);
    }
  }

  /**
   * Find game definitions by type
   * @param {string} type - The type of games to find
   * @returns {Promise<Array>} Array of game definitions
   */
  async findByType(type) {
    try {
      return await this.model.find({ type });
    } catch (error) {
      throw new Error(`Error finding game definitions by type: ${error.message}`);
    }
  }

  /**
   * Find all games that have applicable superpowers
   * @returns {Promise<Array>} Array of games with superpowers
   */
  async findGamesWithSuperpowers() {
    try {
      return await this.model.find({
        'applicableSuperpowers.0': { $exists: true }
      });
    } catch (error) {
      throw new Error(`Error finding games with superpowers: ${error.message}`);
    }
  }

  /**
   * Find games by minimum number of players
   * @param {number} minPlayers - Minimum number of players
   * @returns {Promise<Array>} Array of matching games
   */
  async findByMinPlayers(minPlayers) {
    try {
      return await this.model.find({
        minPlayers: { $lte: minPlayers }
      });
    } catch (error) {
      throw new Error(`Error finding games by min players: ${error.message}`);
    }
  }

  /**
   * Find games by maximum number of players
   * @param {number} maxPlayers - Maximum number of players
   * @returns {Promise<Array>} Array of matching games
   */
  async findByMaxPlayers(maxPlayers) {
    try {
      return await this.model.find({
        $or: [
          { maxPlayers: null }, // No limit
          { maxPlayers: { $gte: maxPlayers } }
        ]
      });
    } catch (error) {
      throw new Error(`Error finding games by max players: ${error.message}`);
    }
  }

  /**
   * Find games suitable for a specific number of players
   * @param {number} playerCount - Number of players
   * @returns {Promise<Array>} Array of suitable games
   */
  async findByPlayerCount(playerCount) {
    try {
      return await this.model.find({
        minPlayers: { $lte: playerCount },
        $or: [
          { maxPlayers: null }, // No limit
          { maxPlayers: { $gte: playerCount } }
        ]
      });
    } catch (error) {
      throw new Error(`Error finding games by player count: ${error.message}`);
    }
  }

  /**
   * Find games by time limit range
   * @param {number} minTime - Minimum time in seconds
   * @param {number} maxTime - Maximum time in seconds
   * @returns {Promise<Array>} Array of games within time range
   */
  async findByTimeRange(minTime, maxTime) {
    try {
      return await this.model.find({
        timeLimit: {
          $gte: minTime,
          $lte: maxTime
        }
      });
    } catch (error) {
      throw new Error(`Error finding games by time range: ${error.message}`);
    }
  }

  /**
   * Find games that require specific equipment
   * @param {Array<string>} equipment - Array of required equipment
   * @returns {Promise<Array>} Array of games with matching equipment
   */
  async findByEquipment(equipment) {
    try {
      return await this.model.find({
        equipment: { $in: equipment }
      });
    } catch (error) {
      throw new Error(`Error finding games by equipment: ${error.message}`);
    }
  }

  /**
   * Find games that work with a specific animal superpower
   * @param {string} animalName - Name of the animal
   * @returns {Promise<Array>} Array of applicable games
   */
  async findByAnimal(animalName) {
    try {
      return await this.model.find({
        'applicableSuperpowers.animal': animalName
      });
    } catch (error) {
      throw new Error(`Error finding games by animal: ${error.message}`);
    }
  }

  /**
   * Search games by name or description (case-insensitive)
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching games
   */
  async search(searchTerm) {
    try {
      const regex = new RegExp(searchTerm, 'i');
      return await this.model.find({
        $or: [
          { name: regex },
          { description: regex }
        ]
      });
    } catch (error) {
      throw new Error(`Error searching games: ${error.message}`);
    }
  }

  /**
   * Get games with pagination
   * @param {number} page - Page number (starting from 1)
   * @param {number} limit - Number of items per page
   * @param {Object} filter - Optional filter criteria
   * @param {Object} sort - Optional sort criteria
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async findWithPagination(page = 1, limit = 10, filter = {}, sort = { name: 1 }) {
    try {
      const skip = (page - 1) * limit;
      const total = await this.model.countDocuments(filter);
      const games = await this.model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      return {
        data: games,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error finding games with pagination: ${error.message}`);
    }
  }

  /**
   * Initialize games by clearing existing data and inserting new games
   * @param {Array<Object>} gamesData - Array of game objects to insert
   * @returns {Promise<Array>} Array of inserted games
   */
  async initializeGames(gamesData) {
    try {
      // Clear existing games
      await this.model.deleteMany({});
      
      // Insert new games
      return await this.model.insertMany(gamesData);
    } catch (error) {
      throw new Error(`Error initializing games: ${error.message}`);
    }
  }

  /**
   * Bulk update games
   * @param {Array<Object>} updates - Array of update operations
   * @returns {Promise<Object>} Bulk write result
   */
  async bulkUpdate(updates) {
    try {
      const bulkOperations = updates.map(update => ({
        updateOne: {
          filter: { _id: update.id },
          update: { $set: update.data },
          upsert: false
        }
      }));

      return await this.model.bulkWrite(bulkOperations);
    } catch (error) {
      throw new Error(`Error bulk updating games: ${error.message}`);
    }
  }

  /**
   * Add superpower to a game
   * @param {string} gameId - Game ID
   * @param {Object} superpower - Superpower object to add
   * @returns {Promise<Object>} Updated game
   */
  async addSuperpowerToGame(gameId, superpower) {
    try {
      return await this.model.findByIdAndUpdate(
        gameId,
        { $push: { applicableSuperpowers: superpower } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error adding superpower to game: ${error.message}`);
    }
  }

  /**
   * Remove superpower from a game
   * @param {string} gameId - Game ID
   * @param {string} animalName - Name of animal whose superpower to remove
   * @returns {Promise<Object>} Updated game
   */
  async removeSuperpowerFromGame(gameId, animalName) {
    try {
      return await this.model.findByIdAndUpdate(
        gameId,
        { $pull: { applicableSuperpowers: { animal: animalName } } },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error removing superpower from game: ${error.message}`);
    }
  }

  /**
   * Get game statistics
   * @returns {Promise<Object>} Statistics about games
   */
  async getGameStats() {
    try {
      const totalGames = await this.model.countDocuments();
      const gamesByType = await this.model.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      const avgTimeLimit = await this.model.aggregate([
        { $group: { _id: null, avgTime: { $avg: '$timeLimit' } } }
      ]);
      const gamesWithSuperpowers = await this.model.countDocuments({
        'applicableSuperpowers.0': { $exists: true }
      });

      return {
        totalGames,
        gamesByType: gamesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageTimeLimit: avgTimeLimit[0]?.avgTime || 0,
        gamesWithSuperpowers
      };
    } catch (error) {
      throw new Error(`Error getting game statistics: ${error.message}`);
    }
  }

  /**
   * Validate game data before creation/update
   * @param {Object} gameData - Game data to validate
   * @returns {Object} Validation result
   */
  validateGameData(gameData) {
    const errors = [];
    
    if (!gameData.name || typeof gameData.name !== 'string') {
      errors.push('Name is required and must be a string');
    }
    
    if (!gameData.type || typeof gameData.type !== 'string') {
      errors.push('Type is required and must be a string');
    }
    
    if (gameData.minPlayers && typeof gameData.minPlayers !== 'number') {
      errors.push('MinPlayers must be a number');
    }
    
    if (gameData.maxPlayers !== null && gameData.maxPlayers !== undefined && typeof gameData.maxPlayers !== 'number') {
      errors.push('MaxPlayers must be a number or null');
    }
    
    if (gameData.minPlayers && gameData.maxPlayers && gameData.minPlayers > gameData.maxPlayers) {
      errors.push('MinPlayers cannot be greater than MaxPlayers');
    }
    
    if (gameData.timeLimit && typeof gameData.timeLimit !== 'number') {
      errors.push('TimeLimit must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default GameRepository;