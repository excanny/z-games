// migrations/migrationRunner.js - Database Migration System
import { pathToFileURL } from 'url';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'zgames',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true // Allow multiple SQL statements
};

class MigrationRunner {
  constructor() {
    this.connection = null;
    this.migrationsPath = path.join(__dirname, 'files');
  }

  async connect() {
    console.log('🔌 Connecting to database...');
    this.connection = await mysql.createConnection(dbConfig);
    
    // Test connection
    const [result] = await this.connection.execute('SELECT 1 as test');
    console.log('✅ Database connection established');
    
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Database connection closed');
    }
  }

  async ensureMigrationsTable() {
    console.log('📋 Ensuring migrations table exists...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INT DEFAULT 0,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT NULL,
        INDEX idx_filename (filename),
        INDEX idx_executed_at (executed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await this.connection.execute(createTableSQL);
    console.log('✅ Migrations table ready');
  }

  async getExecutedMigrations() {
    const [rows] = await this.connection.execute(
      'SELECT filename FROM migrations WHERE success = TRUE ORDER BY executed_at ASC'
    );
    return rows.map(row => row.filename);
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
        .sort(); // Ensure consistent order
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📁 Creating migrations directory...');
        await fs.mkdir(this.migrationsPath, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  async executeSQLFile(filename, filepath) {
    console.log(`   📄 Executing SQL file: ${filename}`);
    
    const sqlContent = await fs.readFile(filepath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await this.connection.execute(statement);
      }
    }
  }

async executeSQLFileSimple(filename, filepath) {
  console.log(`   📄 Executing SQL file: ${filename}`);
  
  const sqlContent = await fs.readFile(filepath, 'utf8');
  
  // Remove comments and empty lines
  const cleanSQL = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
    .join('\n')
    .trim();

  if (cleanSQL) {
    console.log(`   📊 Executing complete SQL file (${cleanSQL.length} characters)`);
    await this.connection.execute(cleanSQL);
    console.log(`   ✅ SQL file executed successfully`);
  }
}

// Add this method to your MigrationRunner class

async executeJSFile(filename, filepath) {
  console.log(`   📄 Executing JS file: ${filename}`);
  
  try {
    // Convert file path to file URL for dynamic import
    const fileUrl = pathToFileURL(filepath).href;
    
    // Dynamically import the migration module
    const migrationModule = await import(fileUrl);
    
    // Check if the module has an 'up' function (standard migration pattern)
    if (typeof migrationModule.up === 'function') {
      console.log(`   🔄 Running 'up' migration function...`);
      await migrationModule.up(this.connection);
    } 
    // Check if the module has a default export function
    else if (typeof migrationModule.default === 'function') {
      console.log(`   🔄 Running default migration function...`);
      await migrationModule.default(this.connection);
    }
    // Check if the module exports a function directly
    else if (typeof migrationModule === 'function') {
      console.log(`   🔄 Running migration function...`);
      await migrationModule(this.connection);
    }
    else {
      throw new Error(`Migration file ${filename} must export an 'up' function, default function, or be a function export`);
    }
    
    console.log(`   ✅ JS file executed successfully`);
    
  } catch (error) {
    console.error(`   ❌ Error executing JS file: ${error.message}`);
    throw error;
  }
}

  async executeMigration(filename) {
    const filepath = path.join(this.migrationsPath, filename);
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Executing: ${filename}`);
      
      if (filename.endsWith('.sql')) {
        await this.executeSQLFile(filename, filepath);
      } else if (filename.endsWith('.js')) {
        await this.executeJSFile(filename, filepath);
      }
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      await this.connection.execute(
        `INSERT INTO migrations (filename, execution_time_ms, success) 
         VALUES (?, ?, TRUE)`,
        [filename, executionTime]
      );
      
      console.log(`✅ Completed: ${filename} (${executionTime}ms)`);
      return { success: true, executionTime };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failed migration
      await this.connection.execute(
        `INSERT INTO migrations (filename, execution_time_ms, success, error_message) 
         VALUES (?, ?, FALSE, ?)`,
        [filename, executionTime, error.message]
      );
      
      console.error(`❌ Failed: ${filename} - ${error.message}`);
      throw error;
    }
  }

  async runMigrations(options = {}) {
    const { force = false, target = null } = options;
    
    console.log('\n🚀 ===============================');
    console.log('🚀 DATABASE MIGRATION STARTED');
    console.log('🚀 ===============================\n');
    
    const startTime = Date.now();
    let results = {
      executed: [],
      skipped: [],
      failed: [],
      totalTime: 0
    };

    try {
      await this.connect();
      await this.ensureMigrationsTable();
      
      const executedMigrations = force ? [] : await this.getExecutedMigrations();
      const allMigrations = await this.getMigrationFiles();
      
      console.log(`📊 Found ${allMigrations.length} migration files`);
      console.log(`📊 Previously executed: ${executedMigrations.length}`);
      
      // Filter migrations to run
      let migrationsToRun = allMigrations.filter(file => 
        !executedMigrations.includes(file)
      );
      
      // If target specified, only run up to that migration
      if (target) {
        const targetIndex = migrationsToRun.findIndex(file => file === target);
        if (targetIndex === -1) {
          throw new Error(`Target migration '${target}' not found`);
        }
        migrationsToRun = migrationsToRun.slice(0, targetIndex + 1);
      }
      
      if (migrationsToRun.length === 0) {
        console.log('✅ No new migrations to run. Database is up to date!');
        return results;
      }
      
      console.log(`🔄 Running ${migrationsToRun.length} migrations...\n`);
      
      // Execute migrations sequentially
      for (let i = 0; i < migrationsToRun.length; i++) {
        const filename = migrationsToRun[i];
        
        try {
          console.log(`[${i + 1}/${migrationsToRun.length}]`);
          const result = await this.executeMigration(filename);
          results.executed.push({ filename, ...result });
          
        } catch (error) {
          results.failed.push({ filename, error: error.message });
          
          if (!options.continueOnError) {
            console.error('\n💥 Migration failed. Stopping execution.');
            break;
          } else {
            console.log('⚠️  Continuing despite error...\n');
          }
        }
      }
      
      // Summary
      const totalTime = Date.now() - startTime;
      results.totalTime = totalTime;
      
      console.log('\n🏁 ===============================');
      console.log('🏁 MIGRATION SUMMARY');
      console.log('🏁 ===============================');
      console.log(`✅ Executed: ${results.executed.length}`);
      console.log(`⏭️  Skipped: ${results.skipped.length}`);
      console.log(`❌ Failed: ${results.failed.length}`);
      console.log(`⏱️  Total time: ${totalTime}ms`);
      
      if (results.failed.length > 0) {
        console.log('\n❌ Failed migrations:');
        results.failed.forEach(({ filename, error }) => {
          console.log(`   • ${filename}: ${error}`);
        });
      }
      
      console.log('🏁 ===============================\n');
      
      return results;
      
    } finally {
      await this.disconnect();
    }
  }

  async getStatus() {
    console.log('\n📊 ===============================');
    console.log('📊 MIGRATION STATUS');
    console.log('📊 ===============================\n');
    
    try {
      await this.connect();
      await this.ensureMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const allMigrations = await this.getMigrationFiles();
      const pendingMigrations = allMigrations.filter(file => 
        !executedMigrations.includes(file)
      );
      
      console.log(`📁 Total migration files: ${allMigrations.length}`);
      console.log(`✅ Executed migrations: ${executedMigrations.length}`);
      console.log(`⏳ Pending migrations: ${pendingMigrations.length}\n`);
      
      if (executedMigrations.length > 0) {
        console.log('✅ Executed:');
        executedMigrations.forEach(file => console.log(`   • ${file}`));
        console.log('');
      }
      
      if (pendingMigrations.length > 0) {
        console.log('⏳ Pending:');
        pendingMigrations.forEach(file => console.log(`   • ${file}`));
        console.log('');
      }
      
      // Get recent migration history
      const [recentMigrations] = await this.connection.execute(`
        SELECT filename, executed_at, execution_time_ms, success, error_message 
        FROM migrations 
        ORDER BY executed_at DESC 
        LIMIT 5
      `);
      
      if (recentMigrations.length > 0) {
        console.log('📅 Recent migrations:');
        recentMigrations.forEach(migration => {
          const status = migration.success ? '✅' : '❌';
          const time = new Date(migration.executed_at).toLocaleString();
          console.log(`   ${status} ${migration.filename} (${time})`);
        });
      }
      
      console.log('\n📊 ===============================\n');
      
      return {
        total: allMigrations.length,
        executed: executedMigrations.length,
        pending: pendingMigrations.length,
        pendingFiles: pendingMigrations
      };
      
    } finally {
      await this.disconnect();
    }
  }

  async rollback(target = null) {
    console.log('\n🔄 ===============================');
    console.log('🔄 MIGRATION ROLLBACK');
    console.log('🔄 ===============================\n');
    
    console.log('⚠️  Rollback functionality not implemented yet.');
    console.log('💡 For rollbacks, create new migration files with DOWN operations.');
    console.log('📝 Example: 002_rollback_user_changes.sql\n');
  }
}

// Helper function to get migration files (for external use)
async function getMigrationFiles() {
  const migrationsPath = path.join(__dirname, 'files');
  try {
    const files = await fs.readdir(migrationsPath);
    return files
      .filter(file => file.endsWith('.sql') || file.endsWith('.js'))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || 'help';
  const runner = new MigrationRunner();
  
  try {
    switch (command.toLowerCase()) {
      case 'run':
      case 'migrate':
        await runner.runMigrations({
          force: process.argv.includes('--force'),
          continueOnError: process.argv.includes('--continue-on-error')
        });
        break;
        
      case 'status':
        await runner.getStatus();
        break;
        
      case 'rollback':
        await runner.rollback();
        break;
        
      case 'help':
      default:
        console.log('🗄️  Database Migration Runner\n');
        console.log('Available commands:');
        console.log('  run, migrate    - Run pending migrations');
        console.log('  status          - Show migration status');
        console.log('  rollback        - Rollback migrations (not implemented)');
        console.log('  help            - Show this help\n');
        console.log('Options:');
        console.log('  --force         - Re-run all migrations');
        console.log('  --continue-on-error - Continue even if a migration fails\n');
        console.log('Examples:');
        console.log('  npm run migrate');
        console.log('  npm run migrate:status');
        console.log('  node migrations/migrationRunner.js run');
        break;
    }
  } catch (error) {
    console.error(`\n💥 Migration error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use in other files
export { MigrationRunner, getMigrationFiles };

// Run CLI if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}