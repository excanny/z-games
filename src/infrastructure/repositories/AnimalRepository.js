import mysql from 'mysql2/promise';

class AnimalRepository {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'zgames',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async findById(id) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM animals WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? this.mapRowToAnimal(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding animal by ID: ${error.message}`);
    }
  }

  async findByName(name) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM animals WHERE name = ?',
        [name]
      );
      return rows.length > 0 ? this.mapRowToAnimal(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding animal by name: ${error.message}`);
    }
  }

  async findByGame(gameName) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT a.* FROM animals a 
         JOIN animal_games ag ON a.id = ag.animal_id 
         WHERE ag.game_name = ?`,
        [gameName]
      );
      return rows.map(row => this.mapRowToAnimal(row));
    } catch (error) {
      throw new Error(`Error finding animals by game: ${error.message}`);
    }
  }

  async getAvailableAnimals() {
    try {
      const [rows] = await this.pool.execute(
        'SELECT name, superpower_description FROM animals'
      );
      return rows.map(row => ({
        name: row.name,
        superpower: {
          description: row.superpower_description
        }
      }));
    } catch (error) {
      throw new Error(`Error getting available animals: ${error.message}`);
    }
  }

  async create(animalData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO animals (name, superpower_name, superpower_description, superpower_power_level) 
         VALUES (?, ?, ?, ?)`,
        [
          animalData.name,
          animalData.superpower?.name || null,
          animalData.superpower?.description || null,
          animalData.superpower?.powerLevel || null
        ]
      );

      const animalId = result.insertId;

      // Insert applicable games if they exist
      if (animalData.superpower?.applicableGames?.length > 0) {
        const gameValues = animalData.superpower.applicableGames.map(game => [animalId, game]);
        await connection.query(
          'INSERT INTO animal_games (animal_id, game_name) VALUES ?',
          [gameValues]
        );
      }

      await connection.commit();
      return await this.findById(animalId);
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating animal: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async update(id, updateData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const updateFields = [];
      const updateValues = [];

      if (updateData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updateData.name);
      }
      if (updateData.superpower?.name !== undefined) {
        updateFields.push('superpower_name = ?');
        updateValues.push(updateData.superpower.name);
      }
      if (updateData.superpower?.description !== undefined) {
        updateFields.push('superpower_description = ?');
        updateValues.push(updateData.superpower.description);
      }
      if (updateData.superpower?.powerLevel !== undefined) {
        updateFields.push('superpower_power_level = ?');
        updateValues.push(updateData.superpower.powerLevel);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await connection.execute(
          `UPDATE animals SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      // Update applicable games if provided
      if (updateData.superpower?.applicableGames !== undefined) {
        await connection.execute('DELETE FROM animal_games WHERE animal_id = ?', [id]);
        
        if (updateData.superpower.applicableGames.length > 0) {
          const gameValues = updateData.superpower.applicableGames.map(game => [id, game]);
          await connection.query(
            'INSERT INTO animal_games (animal_id, game_name) VALUES ?',
            [gameValues]
          );
        }
      }

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating animal: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete related games first
      await connection.execute('DELETE FROM animal_games WHERE animal_id = ?', [id]);
      
      // Delete the animal
      const [result] = await connection.execute('DELETE FROM animals WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error deleting animal: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async findAll() {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM animals');
      return rows.map(row => this.mapRowToAnimal(row));
    } catch (error) {
      throw new Error(`Error finding all animals: ${error.message}`);
    }
  }

  async initializeAnimals(animalsData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing data
      await connection.execute('DELETE FROM animal_games');
      await connection.execute('DELETE FROM animals');

      // Insert new animals
      for (const animalData of animalsData) {
        const [result] = await connection.execute(
          `INSERT INTO animals (name, superpower_name, superpower_description, superpower_power_level) 
           VALUES (?, ?, ?, ?)`,
          [
            animalData.name,
            animalData.superpower?.name || null,
            animalData.superpower?.description || null,
            animalData.superpower?.powerLevel || null
          ]
        );

        const animalId = result.insertId;

        // Insert applicable games if they exist
        if (animalData.superpower?.applicableGames?.length > 0) {
          const gameValues = animalData.superpower.applicableGames.map(game => [animalId, game]);
          await connection.query(
            'INSERT INTO animal_games (animal_id, game_name) VALUES ?',
            [gameValues]
          );
        }
      }

      await connection.commit();
      return await this.findAll();
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error initializing animals: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Helper method to map database row to animal object
  mapRowToAnimal(row) {
    return {
      id: row.id,
      name: row.name,
      superpower: {
        name: row.superpower_name,
        description: row.superpower_description,
        powerLevel: row.superpower_power_level,
        applicableGames: [] // Will be populated by a separate query if needed
      }
    };
  }

  // Get animal with applicable games
  async findByIdWithGames(id) {
    try {
      const animal = await this.findById(id);
      if (!animal) return null;

      const [gameRows] = await this.pool.execute(
        'SELECT game_name FROM animal_games WHERE animal_id = ?',
        [id]
      );

      animal.superpower.applicableGames = gameRows.map(row => row.game_name);
      return animal;
    } catch (error) {
      throw new Error(`Error finding animal with games: ${error.message}`);
    }
  }

  // Close the connection pool
  async close() {
    await this.pool.end();
  }
}

export default AnimalRepository;