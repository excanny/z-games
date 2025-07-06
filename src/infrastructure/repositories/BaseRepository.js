class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new Error(`Error creating ${this.model.modelName}: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      throw new Error(`Error finding ${this.model.modelName} by ID: ${error.message}`);
    }
  }

  async findAll(filter = {}) {
    try {
      return await this.model.find(filter);
    } catch (error) {
      throw new Error(`Error finding ${this.model.modelName}s: ${error.message}`);
    }
  }

  async findOne(filter) {
    try {
      return await this.model.findOne(filter);
    } catch (error) {
      throw new Error(`Error finding ${this.model.modelName}: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      return await this.model.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw new Error(`Error updating ${this.model.modelName}: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error deleting ${this.model.modelName}: ${error.message}`);
    }
  }

  async count(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      throw new Error(`Error counting ${this.model.modelName}s: ${error.message}`);
    }
  }

  async exists(filter) {
    try {
      return await this.model.exists(filter);
    } catch (error) {
      throw new Error(`Error checking existence of ${this.model.modelName}: ${error.message}`);
    }
  }
}


// Export the BaseRepository class
export default BaseRepository;