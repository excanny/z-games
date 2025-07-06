import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Schema for tracking seeding status
const seedingStatusSchema = new mongoose.Schema({
  seedingCompleted: { type: Boolean, default: false },
  lastSeedingDate: { type: Date, default: Date.now },
  seedingVersion: { type: String, default: '1.0.0' },
  collectionsSeeded: [String],
  lastDataCheck: { type: Date, default: Date.now }
});

const SeedingStatus = mongoose.model('SeedingStatus', seedingStatusSchema);

const connectDB = async (forceReseed = false) => {
  try {
    // Optimized connection - removed deprecated options
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    // Configure Mongoose-specific buffer settings
    mongoose.set('bufferCommands', false);

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    
    // Check seeding status and data integrity
    await handleSeedingAndDataRestoration(forceReseed);

  } catch (err) {
    console.error('❌ Initial DB connection failed:', err.message);
    console.error('Full error details:', err);
    process.exit(1);
  }
};

const handleSeedingAndDataRestoration = async (forceReseed = false) => {
  try {
    console.log('\n🔍 Checking database seeding status...');
    
    // Check if seeding has been completed
    let seedingStatus = await SeedingStatus.findOne();
    
    const shouldSeed = !seedingStatus || !seedingStatus.seedingCompleted || forceReseed;
    const shouldCheckData = !shouldSeed; // Only check data if not seeding
    
    if (shouldSeed) {
      console.log('🔄 Initial seeding required or forced reseed requested');
      await performSeeding();
    } else {
      console.log('✅ Initial seeding already completed');
      console.log(`📅 Last seeded: ${seedingStatus.lastSeedingDate}`);
      console.log(`📦 Collections seeded: ${seedingStatus.collectionsSeeded.join(', ')}`);
    }
    
    if (shouldCheckData) {
      console.log('\n🔍 Checking for missing data...');
      await checkAndRestoreData(seedingStatus);
    }
    
  } catch (error) {
    console.error('❌ Error in seeding/data restoration process:', error.message);
    throw error;
  }
};

const performSeeding = async () => {
  console.log('\n🚀 Initiating seeding process...');
  
  try {
    // Dynamic import with error handling
    const { default: masterSeeder } = await import('../../masterSeeder.js');
    
    console.log('✅ Seeder module loaded successfully');
    
    const seedingResult = await masterSeeder();
    
    if (seedingResult) {
      console.log('🎊 Database seeding completed successfully');
      
      // Get list of collections that were seeded
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections
        .map(col => col.name)
        .filter(name => !name.startsWith('system.') && name !== 'seedingstatuses');
      
      // Update or create seeding status
      await SeedingStatus.findOneAndUpdate(
        {},
        {
          seedingCompleted: true,
          lastSeedingDate: new Date(),
          collectionsSeeded: collectionNames,
          lastDataCheck: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log('📝 Seeding status recorded successfully');
    } else {
      console.warn('⚠️  Seeding completed with warnings');
    }
    
  } catch (seedError) {
    console.error('\n💥 SEEDING FAILED:');
    console.error('=====================================');
    console.error('Error type:', seedError.name);
    console.error('Error message:', seedError.message);
    console.error('Stack trace:', seedError.stack);
    console.error('=====================================');
    
    // Check for common issues
    if (seedError.message.includes('Cannot resolve module')) {
      console.error('🔍 Troubleshooting: Check if masterSeeder.js path is correct');
    }
    if (seedError.message.includes('MongoError') || seedError.message.includes('connection')) {
      console.error('🔍 Troubleshooting: Database connection issue during seeding');
    }
    
    throw seedError; // Re-throw to handle in parent function
  }
};

const checkAndRestoreData = async (seedingStatus) => {
  try {
    const currentTime = new Date();
    const lastCheck = seedingStatus.lastDataCheck;
    const timeSinceLastCheck = currentTime - lastCheck;
    const checkInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Skip if checked recently (unless it's been more than 5 minutes)
    if (timeSinceLastCheck < checkInterval) {
      console.log('ℹ️  Data integrity check skipped (checked recently)');
      return;
    }
    
    console.log('🔍 Performing data integrity check...');
    
    const collectionsToCheck = seedingStatus.collectionsSeeded || [];
    const missingCollections = [];
    const emptyCollections = [];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count === 0) {
          emptyCollections.push(collectionName);
          console.log(`⚠️  Collection '${collectionName}' is empty`);
        } else {
          console.log(`✅ Collection '${collectionName}': ${count} documents`);
        }
      } catch (error) {
        if (error.message.includes('does not exist')) {
          missingCollections.push(collectionName);
          console.log(`❌ Collection '${collectionName}' is missing`);
        } else {
          console.error(`❌ Error checking collection '${collectionName}':`, error.message);
        }
      }
    }
    
    // If any data is missing, trigger restoration
    if (missingCollections.length > 0 || emptyCollections.length > 0) {
      console.log('\n🔄 Missing data detected, initiating restoration...');
      console.log(`Missing collections: ${missingCollections.join(', ') || 'None'}`);
      console.log(`Empty collections: ${emptyCollections.join(', ') || 'None'}`);
      
      await performDataRestoration();
    } else {
      console.log('✅ All seeded data is intact');
    }
    
    // Update last check time
    await SeedingStatus.findOneAndUpdate(
      {},
      { lastDataCheck: currentTime }
    );
    
  } catch (error) {
    console.error('❌ Error during data integrity check:', error.message);
    // Don't throw - this shouldn't stop the application
  }
};

const performDataRestoration = async () => {
  try {
    console.log('🔧 Starting data restoration process...');
    
    // Import and run the seeder again for restoration
    const { default: masterSeeder } = await import('../../masterSeeder.js');
    
    console.log('📦 Running seeder for data restoration...');
    const restorationResult = await masterSeeder();
    
    if (restorationResult) {
      console.log('🎉 Data restoration completed successfully');
      
      // Update the last seeding date to reflect restoration
      await SeedingStatus.findOneAndUpdate(
        {},
        { 
          lastSeedingDate: new Date(),
          lastDataCheck: new Date()
        }
      );
    } else {
      console.warn('⚠️  Data restoration completed with warnings');
    }
    
  } catch (error) {
    console.error('❌ Data restoration failed:', error.message);
    console.error('🔍 Manual intervention may be required');
    // Don't throw - application should continue even if restoration fails
  }
};

// Enhanced connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('🔍 Error details:', {
    name: err.name,
    code: err.code,
    codeName: err.codeName
  });
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
  // Optionally check data integrity after reconnection
  console.log('🔍 Checking data integrity after reconnection...');
});

mongoose.connection.on('connecting', () => {
  console.log('🔄 MongoDB connecting...');
});

mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connected to database');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}, closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Export both the connection function and utility functions
export default connectDB;
export { performDataRestoration, checkAndRestoreData };