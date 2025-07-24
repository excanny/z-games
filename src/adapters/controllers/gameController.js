import AnimalRepository from '../../infrastructure/repositories/AnimalRepository.js';
import GameRepository from '../../infrastructure/repositories/GameRepository.js';

class GameController {
  constructor() {
    this.animalRepository = new AnimalRepository();
    this.gameRepository = new GameRepository();
  }

  // ===== GAME MANAGEMENT METHODS =====

  async getAllGames(req, res) {
    try {
      const games = await this.gameRepository.findAll();

      res.status(200).json({
        success: true,
        count: games.length,
        data: games
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get all games',
        error: error.message
      });
    }
  }

  async getGamesByType(req, res) {
    try {
      const { type } = req.params;
      const games = await this.gameRepository.findByType(type);
      
      // Optionally filter by available animals
      const availableAnimals = await this.animalRepository.getAvailableAnimals();
      const availableAnimalNames = new Set(availableAnimals.map(animal => animal.name));
      
      const filteredGames = games.map(game => ({
        ...game.toObject(),
        applicableSuperpowers: game.applicableSuperpowers.filter(superpower =>
          availableAnimalNames.has(superpower.animal)
        )
      })).filter(game => game.applicableSuperpowers.length > 0);

      res.status(200).json({
        success: true,
        count: filteredGames.length,
        data: filteredGames
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to get games by type: ${type}`,
        error: error.message
      });
    }
  }

  /**
 * Get a game by its ID
 */
async getGameById(req, res) {
  try {
    const { id } = req.params;
    const game = await this.gameRepository.findById(id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: `Game with ID '${id}' not found`
      });
    }

    // Filter applicable superpowers to only include available animals
    const availableAnimals = await this.animalRepository.getAvailableAnimals();
    const availableAnimalNames = new Set(availableAnimals.map(animal => animal.name));

    const gameWithAvailableSuperpowers = {
      ...game.toObject(),
      applicableSuperpowers: game.applicableSuperpowers.filter(superpower =>
        availableAnimalNames.has(superpower.animal)
      )
    };

    res.status(200).json({
      success: true,
      data: gameWithAvailableSuperpowers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get game by ID`,
      error: error.message
    });
  }
}

  async getGameByName(req, res) {
    try {
      const { name } = req.params;
      const game = await this.gameRepository.findByName(name);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          message: `Game '${name}' not found`
        });
      }

      // Filter applicable superpowers to only include available animals
      const availableAnimals = await this.animalRepository.getAvailableAnimals();
      const availableAnimalNames = new Set(availableAnimals.map(animal => animal.name));
      
      const gameWithAvailableSuperpowers = {
        ...game.toObject(),
        applicableSuperpowers: game.applicableSuperpowers.filter(superpower =>
          availableAnimalNames.has(superpower.animal)
        )
      };

      res.status(200).json({
        success: true,
        data: gameWithAvailableSuperpowers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to get game by name: ${name}`,
        error: error.message
      });
    }
  }

  async createGame(req, res) {
    try {
      const gameData = req.body;
      const newGame = await this.gameRepository.create(gameData);

      res.status(201).json({
        success: true,
        message: 'Game created successfully',
        data: newGame
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create game',
        error: error.message
      });
    }
  }

  async updateGame(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedGame = await this.gameRepository.update(id, updateData);
      
      if (!updatedGame) {
        return res.status(404).json({
          success: false,
          message: `Game with ID '${id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Game updated successfully',
        data: updatedGame
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update game',
        error: error.message
      });
    }
  }

  async deleteGame(req, res) {
    try {
      const { id } = req.params;
      const deletedGame = await this.gameRepository.delete(id);
      
      if (!deletedGame) {
        return res.status(404).json({
          success: false,
          message: `Game with ID '${id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Game deleted successfully',
        data: deletedGame
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete game',
        error: error.message
      });
    }
  }

  async initializeGames(req, res) {
    try {
      const gamesData = req.body;
      
      if (!Array.isArray(gamesData)) {
        return res.status(400).json({
          success: false,
          message: 'Games data must be an array'
        });
      }

      const initializedGames = await this.gameRepository.initializeGames(gamesData);

      res.status(200).json({
        success: true,
        message: `Successfully initialized ${initializedGames.length} games`,
        data: initializedGames
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize games',
        error: error.message
      });
    }
  }
}

export default GameController;