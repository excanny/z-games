import mysql from 'mysql2/promise';
import dbConfig from '../../config/db.js';

class GameRepository {
  constructor() {
    // Create connection pool using the imported dbConfig
    this.pool = mysql.createPool(dbConfig);
  }

  // Method 1: Using pool.getConnection() (if you need individual connections)
  async findAll() {
    let connection;
    try {
      connection = await this.pool.getConnection();
      const [rows] = await connection.execute('SELECT * FROM games');
      return rows;
    } catch (error) {
      console.error('Database error in findAll:', error);
      throw new Error(`Error finding all games: ${error.message}`);
    } finally {
      if (connection) {
        connection.release(); // IMPORTANT: Use release(), not end()
      }
    }
  }

  // Method 2: Using pool directly (recommended - simpler and more efficient)
  async findAllSimple() {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM games');
      return rows;
    } catch (error) {
      console.error('Database error in findAllSimple:', error);
      throw new Error(`Error finding all games: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM games WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Database error in findById:', error);
      throw new Error(`Error finding game by ID: ${error.message}`);
    }
  }

  async findByName(name) {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM games WHERE name = ?', [name]);
      return rows[0] || null;
    } catch (error) {
      console.error('Database error in findByName:', error);
      throw new Error(`Error finding game by name: ${error.message}`);
    }
  }

  async findByType(type) {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM games WHERE type = ?', [type]);
      return rows;
    } catch (error) {
      console.error('Database error in findByType:', error);
      throw new Error(`Error finding games by type: ${error.message}`);
    }
  }

  async create(gameData) {
    try {
      const { name, type, description, rules, difficulty } = gameData;
      const [result] = await this.pool.execute(
        'INSERT INTO games (name, type, description, rules, difficulty) VALUES (?, ?, ?, ?, ?)',
        [name, type, description, rules, difficulty]
      );
      
      // Return the created game
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Database error in create:', error);
      throw new Error(`Error creating game: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      // Build dynamic UPDATE query based on provided fields
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const [result] = await this.pool.execute(
        `UPDATE games SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      
      if (result.affectedRows === 0) {
        return null; // Game not found
      }
      
      return await this.findById(id);
    } catch (error) {
      console.error('Database error in update:', error);
      throw new Error(`Error updating game: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      // Get the game before deleting
      const game = await this.findById(id);
      if (!game) {
        return null;
      }
      
      const [result] = await this.pool.execute('DELETE FROM games WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return game;
    } catch (error) {
      console.error('Database error in delete:', error);
      throw new Error(`Error deleting game: ${error.message}`);
    }
  }

  async initializeGames(gamesData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Clear existing games
      await connection.execute('DELETE FROM games');
      
      const initializedGames = [];
      for (const gameData of gamesData) {
        const { name, type, description, rules, difficulty } = gameData;
        const [result] = await connection.execute(
          'INSERT INTO games (name, type, description, rules, difficulty) VALUES (?, ?, ?, ?, ?)',
          [name, type, description, rules, difficulty]
        );
        
        const [newGame] = await connection.execute('SELECT * FROM games WHERE id = ?', [result.insertId]);
        initializedGames.push(newGame[0]);
      }
      
      await connection.commit();
      return initializedGames;
    } catch (error) {
      await connection.rollback();
      console.error('Database error in initializeGames:', error);
      throw new Error(`Error initializing games: ${error.message}`);
    } finally {
      connection.release(); // Use release() for pooled connections
    }
  }

  // Method to properly close the pool when shutting down the application
  async closePool() {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
}

export default GameRepository;