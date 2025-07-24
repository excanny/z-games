
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration object
const dbConfig = {
  host: process.env.DB_HOST || 'mysql-3aec5c12-excanny-1290.e.aivencloud.com',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_VW8JRrqPxBlPx6AzFhm',
  database: process.env.DB_NAME || 'zgames',
  port: parseInt(process.env.DB_PORT, 10) || 24545,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  multipleStatements: true
};


// Remove the invalid 'reconnect' option
delete dbConfig.reconnect;

// Create connection pool
let pool = null;

async function createPool() {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
  
      // Test the pool
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
   
    } catch (error) {
      console.error('❌ Failed to create MySQL pool:', error.message);
      throw error;
    }
  }
  return pool;
}

// Create single connection (for seeders)
async function createConnection() {
  try {
    // Debug: Log what configuration is being used (without password)
  
    const connection = await mysql.createConnection(dbConfig);
   
    return connection;
  } catch (error) {
    console.error('❌ Failed to create MySQL connection:', error.message);
    console.error('🔍 Config debug:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      userEmpty: dbConfig.user === '',
      passwordEmpty: dbConfig.password === ''
    });
    throw error;
  }
}

// Main connection function
async function connectDB() {
  try {
    
    // Create pool
    const dbPool = await createPool();
    
    // Test connection
    const connection = await dbPool.getConnection();

    console.log('✅ MySQL connection established successfully');
    
    connection.release();
    return dbPool;
    
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔍 Access denied. Check your database credentials:');
      console.error('   - DB_USER:', process.env.DB_USER || 'not set');
      console.error('   - DB_PASSWORD:', process.env.DB_PASSWORD ? 'set' : 'not set');
      console.error('   - DB_HOST:', process.env.DB_HOST || 'not set');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Connection refused. Is MySQL running?');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('🔍 Database does not exist:', dbConfig.database);
    }
    
    throw error;
  }
}

// Export configuration and functions
export default dbConfig;
export { createPool, createConnection, connectDB };