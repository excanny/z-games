import mysql from 'mysql2/promise';
import dbConfig from '../../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserRepository {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '24h';
    this.saltRounds = 12;
    this.pool = mysql.createPool(dbConfig);
  }

  async connect() {
    if (!this.pool) {
      try {
        this.pool = mysql.createPool(this.config);
        
        // Test the connection
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        
      } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async getConnection() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool;
  }

  async createUser(userData) {
    const { email, name, password, ...otherFields } = userData;
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    
    // Build dynamic query based on provided fields
    const fields = ['email', 'name', 'password'];
    const values = [email, name, hashedPassword];
    const placeholders = ['?', '?', '?'];
    
    // Add other fields if they exist
    Object.keys(otherFields).forEach(key => {
      fields.push(key);
      values.push(otherFields[key]);
      placeholders.push('?');
    });
    
    const query = `
      INSERT INTO users (${fields.join(', ')}) 
      VALUES (${placeholders.join(', ')})
    `;
    
    try {
      const db = await this.getConnection();
      const [result] = await db.execute(query, values);
      
      // Return the created user with the new ID (without password)
      const newUser = await this.getUserById(result.insertId);
      delete newUser.password;
      return newUser;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User with this email already exists');
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(query, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }
  }

  async updateUser(id, userData) {
    const fields = Object.keys(userData);
    const values = Object.values(userData);
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    try {
      const db = await this.getConnection();
      const [result] = await db.execute(query, [...values, id]);
      
      if (result.affectedRows === 0) {
        return null; // User not found
      }
      
      return await this.getUserById(id);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    
    try {
      const db = await this.getConnection();
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async getAllUsers(limit = 50, offset = 0) {
    const query = 'SELECT * FROM users LIMIT ? OFFSET ?';
    
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(query, [limit, offset]);
      return rows;
    } catch (error) {
      throw new Error(`Failed to get all users: ${error.message}`);
    }
  }

  // Authentication Methods
  async login(credentials) {
    const { email, password } = credentials;
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      // Get user with password for verification
      const user = await this.getUserByEmailWithPassword(email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async getUserByEmailWithPassword(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(query, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }

  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
      issuer: 'your-app-name',
      subject: user.id.toString()
    });
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const user = await this.getUserById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with current password
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userWithPassword = await this.getUserByEmailWithPassword(user.email);
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password in database
      const query = 'UPDATE users SET password = ? WHERE id = ?';
      const db = await this.getConnection();
      const [result] = await db.execute(query, [hashedNewPassword, userId]);

      if (result.affectedRows === 0) {
        throw new Error('Failed to update password');
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  async resetPassword(email, newPassword) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      
      const query = 'UPDATE users SET password = ? WHERE email = ?';
      const db = await this.getConnection();
      const [result] = await db.execute(query, [hashedPassword, email]);

      if (result.affectedRows === 0) {
        throw new Error('Failed to reset password');
      }

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}

export default UserRepository;