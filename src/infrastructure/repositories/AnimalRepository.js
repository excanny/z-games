import BaseRepository from './BaseRepository.js';
import Animal from '../models/games/Animal.js';

class AnimalRepository extends BaseRepository {
  constructor() {
    super(Animal);
  }

  async findByName(name) {
    try {
      return await this.model.findOne({ name });
    } catch (error) {
      throw new Error(`Error finding animal by name: ${error.message}`);
    }
  }

  async findByGame(gameName) {
    try {
      return await this.model.find({
        'superpower.applicableGames': gameName
      });
    } catch (error) {
      throw new Error(`Error finding animals by game: ${error.message}`);
    }
  }

  async getAvailableAnimals() {
    try {
      return await this.model.find({}, 'name superpower.description');
    } catch (error) {
      throw new Error(`Error getting available animals: ${error.message}`);
    }
  }

  async initializeAnimals(animalsData) {
    try {
      await this.model.deleteMany({});
      return await this.model.insertMany(animalsData);
    } catch (error) {
      throw new Error(`Error initializing animals: ${error.message}`);
    }
  }
}

// Export the AnimalRepository class
export default AnimalRepository;