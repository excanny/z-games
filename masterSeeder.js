// masterSeeder.js - Fixed Database Connection and Seeding
import mysql from 'mysql2/promise';
import seedAnimals from './animalseeder.js';
import seedGames from './gameSeeder.js';
import seedAdmin from './adminSeeder.js';

// Create database configuration directly here since your db.js exports a connection function
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'zgames',
  port: process.env.DB_PORT || 3306,
  // Add these for better connection handling
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Progress tracking utilities (keeping your excellent implementation)
class ProgressTracker {
  constructor(totalSteps = 3) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.stepProgress = {};
    this.startTime = Date.now();
    this.stepStartTime = Date.now();
  }

  startStep(stepName, substeps = 1) {
    this.currentStep++;
    this.stepStartTime = Date.now();
    this.stepProgress[stepName] = {
      current: 0,
      total: substeps,
      status: 'running'
    };
    
    const overallProgress = ((this.currentStep - 1) / this.totalSteps * 100).toFixed(1);
    
    console.log(`\n🔄 [${this.currentStep}/${this.totalSteps}] ${stepName}`);
    console.log(`📊 Overall Progress: ${overallProgress}% | ${this.getProgressBar(overallProgress, 30)}`);
    console.log(`⏱️  Step Started: ${new Date().toLocaleTimeString()}`);
  }

  updateStepProgress(stepName, current, message = '') {
    if (this.stepProgress[stepName]) {
      this.stepProgress[stepName].current = current;
      const stepPercentage = (current / this.stepProgress[stepName].total * 100).toFixed(1);
      
      if (message) {
        console.log(`   ⏳ ${message} (${current}/${this.stepProgress[stepName].total}) ${stepPercentage}%`);
      }
      
      if (this.stepProgress[stepName].total > 1) {
        const miniBar = this.getProgressBar(stepPercentage, 20);
        console.log(`   ${miniBar} ${stepPercentage}%`);
      }
    }
  }

  completeStep(stepName, result = null) {
    if (this.stepProgress[stepName]) {
      this.stepProgress[stepName].status = 'completed';
      this.stepProgress[stepName].current = this.stepProgress[stepName].total;
      
      const stepDuration = ((Date.now() - this.stepStartTime) / 1000).toFixed(2);
      const overallProgress = (this.currentStep / this.totalSteps * 100).toFixed(1);
      
      console.log(`✅ ${stepName} completed in ${stepDuration}s`);
      
      if (result && typeof result === 'object') {
        if (result.inserted !== undefined) console.log(`   📥 Inserted: ${result.inserted}`);
        if (result.updated !== undefined) console.log(`   🔄 Updated: ${result.updated}`);
        if (result.skipped !== undefined) console.log(`   ⏭️  Skipped: ${result.skipped}`);
        if (result.total !== undefined) console.log(`   📊 Total: ${result.total}`);
        if (result.new !== undefined) console.log(`   🆕 New: ${result.new}`);
      }
      
      console.log(`📈 Overall Progress: ${overallProgress}% | ${this.getProgressBar(overallProgress, 30)}`);
    }
  }

  failStep(stepName, error) {
    if (this.stepProgress[stepName]) {
      this.stepProgress[stepName].status = 'failed';
      
      const stepDuration = ((Date.now() - this.stepStartTime) / 1000).toFixed(2);
      
      console.log(`❌ ${stepName} failed after ${stepDuration}s`);
      console.log(`   💥 Error: ${error.message}`);
    }
  }

  getProgressBar(percentage, width = 30) {
    const filled = Math.round(percentage / 100 * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  getTotalDuration() {
    return ((Date.now() - this.startTime) / 1000).toFixed(2);
  }

  getSummary() {
    const totalDuration = this.getTotalDuration();
    const completed = Object.values(this.stepProgress).filter(step => step.status === 'completed').length;
    const failed = Object.values(this.stepProgress).filter(step => step.status === 'failed').length;
    
    return {
      totalDuration,
      completed,
      failed,
      total: Object.keys(this.stepProgress).length
    };
  }
}

// Fixed connection function
async function createConnection() {
  console.log('🔌 Establishing database connection...');
  console.log('📋 Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port
  });
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established successfully');
    
    // Test the connection with more detailed info
    const [result] = await connection.execute('SELECT DATABASE() as db_name, VERSION() as version, USER() as user');
    console.log('🏓 Connection test passed:', result[0]);
    
    return connection;
  } catch (error) {
    console.error('❌ Failed to create database connection:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Suggestion: Make sure MySQL server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Suggestion: Check your database credentials');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Suggestion: Make sure the database exists');
    }
    
    throw error;
  }
}

// Improved seeder wrapper with better error handling
async function runSeederWithProgress(seederName, seederFunction, connection, options, progressTracker) {
  const stepName = `Seeding ${seederName}`;
  
  try {
    progressTracker.startStep(stepName, 3);
    
    // Step 1: Validate seeder function
    progressTracker.updateStepProgress(stepName, 1, `Validating ${seederName} seeder function`);
    
    if (typeof seederFunction !== 'function') {
      throw new Error(`${seederName} seeder is not a function. Got: ${typeof seederFunction}`);
    }
    
    // Step 2: Execute seeder
    progressTracker.updateStepProgress(stepName, 2, `Executing ${seederName} seeder`);
    
    let result;
    
    // Try the most common pattern first - seeder(connection, forceReseed)
    try {
      const forceReseed = options?.forceReseed || false;
      result = await seederFunction(connection, forceReseed);
    } catch (error) {
      // If that fails, try just connection
      console.log(`   ⚠️  Retrying with different parameters...`);
      try {
        result = await seederFunction(connection);
      } catch (error2) {
        // If that fails, try with full options
        result = await seederFunction(connection, options);
      }
    }
    
    // Step 3: Validate and normalize result
    progressTracker.updateStepProgress(stepName, 3, `Processing ${seederName} results`);
    
    if (!result) {
      result = {
        success: true,
        message: `${seederName} completed`,
        inserted: 0,
        updated: 0,
        skipped: 0
      };
    }
    
    // Ensure result is an object
    if (typeof result !== 'object') {
      result = {
        success: true,
        message: `${seederName} completed`,
        raw_result: result
      };
    }
    
    progressTracker.completeStep(stepName, result);
    return result;
    
  } catch (error) {
    console.error(`   💥 ${seederName} seeder failed:`, {
      message: error.message,
      code: error.code,
      errno: error.errno
    });
    
    progressTracker.failStep(stepName, error);
    throw error;
  }
}

// Main seeding function
async function seedAll(options = {}) {
  const { forceReseed = false, skipAnimals = false, skipGames = false, skipAdmin = false } = options;
  
  console.log('\n🌱 ================================');
  console.log('🌱 DATABASE SEEDING INITIATED');
  console.log('🌱 ================================');
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log(`🔧 Options:`, options);
  
  // Debug imports first
  console.log('\n🔍 Checking imports:');
  console.log(`   seedAdmin: ${typeof seedAdmin} (${seedAdmin?.name || 'unnamed'})`);
  console.log(`   seedAnimals: ${typeof seedAnimals} (${seedAnimals?.name || 'unnamed'})`);
  console.log(`   seedGames: ${typeof seedGames} (${seedGames?.name || 'unnamed'})`);
  
  // Calculate total steps
  const totalSteps = [!skipAdmin, !skipAnimals, !skipGames].filter(Boolean).length;
  const progressTracker = new ProgressTracker(totalSteps);
  
  const results = {
    animals: null,
    games: null,
    admin: null,
    success: false,
    errors: [],
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null
  };
  
  let connection;
  
  try {
    // Create shared database connection
    console.log('\n🔌 Setting up database connection...');
    connection = await createConnection();

    // Phase 1: Seed Admin (if not skipped)
    if (!skipAdmin) {
      try {
        console.log('\n👑 Starting Admin Seeding Phase...');
        results.admin = await runSeederWithProgress(
          'Admin', 
          seedAdmin, 
          connection, 
          options,
          progressTracker
        );
      } catch (adminError) {
        console.error(`❌ Admin seeding error: ${adminError.message}`);
        results.errors.push({ phase: 'admin', error: adminError.message });
        // Continue with other seeders
      }
    }

    // Phase 2: Seed Animals (if not skipped)
    if (!skipAnimals) {
      try {
        console.log('\n🦁 Starting Animals Seeding Phase...');
        results.animals = await runSeederWithProgress(
          'Animals', 
          seedAnimals, 
          connection, 
          options,
          progressTracker
        );
      } catch (animalError) {
        console.error(`❌ Animals seeding error: ${animalError.message}`);
        results.errors.push({ phase: 'animals', error: animalError.message });
      }
    }

    // Phase 3: Seed Games (if not skipped)
    if (!skipGames) {
      try {
        console.log('\n🎮 Starting Games Seeding Phase...');
        results.games = await runSeederWithProgress(
          'Games', 
          seedGames, 
          connection, 
          options,
          progressTracker
        );
      } catch (gameError) {
        console.error(`❌ Games seeding error: ${gameError.message}`);
        results.errors.push({ phase: 'games', error: gameError.message });
      }
    }

    // Final results processing
    const summary = progressTracker.getSummary();
    results.success = results.errors.length === 0;
    results.endTime = new Date().toISOString();
    results.duration = summary.totalDuration;

    // Display final summary
    console.log('\n' + '='.repeat(50));
    if (results.success) {
      console.log('🎉 SEEDING COMPLETED SUCCESSFULLY! 🎉');
    } else {
      console.log('⚠️  SEEDING COMPLETED WITH ERRORS ⚠️');
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.phase}: ${err.error}`);
      });
    }
    
    console.log(`📊 Progress: ${summary.completed}/${summary.total} phases completed`);
    console.log(`⏱️  Total Duration: ${summary.totalDuration} seconds`);
    console.log(`🏁 Finished: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    return results;
    
  } catch (criticalError) {
    const summary = progressTracker.getSummary();
    
    console.log('\n' + '❌'.repeat(20));
    console.log('💥 CRITICAL SEEDING FAILURE! 💥');
    console.log(`💥 Critical Error: ${criticalError.message}`);
    console.log(`⏱️  Runtime: ${summary.totalDuration} seconds`);
    console.log('❌'.repeat(20));
    
    results.success = false;
    results.errors.push({ phase: 'critical', error: criticalError.message });
    
    throw criticalError;
    
  } finally {
    // Close connection
    if (connection) {
      try {
        console.log('\n🔌 Closing database connection...');
        await connection.end();
        console.log('✅ Database connection closed successfully');
      } catch (closeError) {
        console.error('⚠️  Warning: Error closing connection:', closeError.message);
      }
    }
  }
}

// Quick diagnostic function
async function quickDiagnostic() {
  console.log('\n🔍 ================================');
  console.log('🔍 QUICK DIAGNOSTIC TEST');
  console.log('🔍 ================================\n');
  
  console.log('1. Checking environment variables...');
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set (using localhost)'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'not set (using root)'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'not set (using zgames_db)'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 'not set (using 3306)'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[SET]' : 'not set'}`);
  
  console.log('\n2. Testing imports...');
  console.log(`   seedAdmin: ${typeof seedAdmin}`);
  console.log(`   seedAnimals: ${typeof seedAnimals}`);
  console.log(`   seedGames: ${typeof seedGames}`);
  
  console.log('\n3. Testing database connection...');
  try {
    const connection = await createConnection();
    console.log('   ✅ Connection successful');
    await connection.end();
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return;
  }
  
  console.log('\n🔍 Diagnostic complete - connection looks good!\n');
}

// Helper functions
async function forceReseedAll() {
  console.log('🔄 ================================');
  console.log('🔄 FORCING COMPLETE RESEED');
  console.log('🔄 ================================');
  return await seedAll({ forceReseed: true });
}

async function seedAdminOnly(forceReseed = false) {
  console.log('👑 ================================');
  console.log('👑 SEEDING ADMIN ONLY');
  console.log('👑 ================================');
  return await seedAll({ skipAnimals: true, skipGames: true, forceReseed });
}

async function seedAnimalsOnly(forceReseed = false) {
  console.log('🦁 ================================');
  console.log('🦁 SEEDING ANIMALS ONLY');
  console.log('🦁 ================================');
  return await seedAll({ skipAnimals: false, skipGames: true, skipAdmin: true, forceReseed });
}

async function seedGamesOnly(forceReseed = false) {
  console.log('🎮 ================================');
  console.log('🎮 SEEDING GAMES ONLY');
  console.log('🎮 ================================');
  return await seedAll({ skipAnimals: true, skipGames: false, skipAdmin: true, forceReseed });
}

async function quickStart() {
  console.log('🚀 ================================');
  console.log('🚀 QUICK START - SEEDING ALL DATA');
  console.log('🚀 ================================');
  
  try {
    const results = await seedAll();
    
    if (results.success) {
      console.log('\n🎊 Quick start completed successfully!');
    } else {
      console.log('\n⚠️  Quick start completed with some errors.');
      console.log(`   ❌ Errors: ${results.errors.length}`);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    throw error;
  }
}

// Export everything
export default seedAll;
export { 
  forceReseedAll, 
  seedAdminOnly, 
  seedAnimalsOnly, 
  seedGamesOnly,
  quickStart,
  quickDiagnostic,
  ProgressTracker
};