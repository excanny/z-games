// masterSeeder.js
import seedAnimals from './animalseeder.js';  // Fixed: case-sensitive filename
import seedGames from './gameSeeder.js';
import seedAdmin from './adminSeeder.js';

async function seedAll(options = {}) {
  const { forceReseed = false, skipAnimals = false, skipGames = false, skipAdmin = false } = options;
  
  console.log('🌱 ================================');
  console.log('🌱 STARTING DATABASE SEEDING...');
  console.log('🌱 ================================');
  
  const startTime = Date.now();
  const results = {
    animals: null,
    games: null,
    admin: null,
    success: false,
    errors: []
  };
  
  try {
    // Seed Admin first (since it's critical)
    if (!skipAdmin) {
      console.log('\n👑 Phase 1: Seeding Admin...');
      console.log('⏳ Processing admin user...');
      
      try {
        results.admin = await seedAdmin(forceReseed);
        console.log('✅ Admin seeding completed!');
        console.log(`📊 Admin Summary: ${results.admin.new || 0} new, ${results.admin.updated || 0} updated, ${results.admin.skipped || 0} skipped`);
      } catch (adminError) {
        console.error('❌ Admin seeding failed:', adminError.message);
        results.errors.push({ phase: 'admin', error: adminError.message });
        // Continue with other seeding even if admin fails
      }
    } else {
      console.log('⏩ Skipping admin seeding...');
    }

    // Seed Animals with progress indication
    if (!skipAnimals) {
      console.log('\n🦁 Phase 2: Seeding Animals...');
      console.log('⏳ Processing animal data...');
      
      try {
        results.animals = await seedAnimals(forceReseed);
        console.log('✅ Animal seeding completed!');
        console.log(`📊 Animals Summary: ${results.animals.new || 0} new, ${results.animals.updated || 0} updated, ${results.animals.restored || 0} restored`);
      } catch (animalError) {
        console.error('❌ Animal seeding failed:', animalError.message);
        results.errors.push({ phase: 'animals', error: animalError.message });
        // Continue with games even if animals fail
      }
    } else {
      console.log('⏩ Skipping animal seeding...');
    }

    // Seed Games with progress indication
    if (!skipGames) {
      console.log('\n🎮 Phase 3: Seeding Games...');
      console.log('⏳ Processing game definitions...');
      
      try {
        results.games = await seedGames(forceReseed);
        console.log('✅ Game seeding completed!');
        console.log(`📊 Games Summary: ${results.games.new || 0} new, ${results.games.updated || 0} updated, ${results.games.restored || 0} restored`);
      } catch (gameError) {
        console.error('❌ Game seeding failed:', gameError.message);
        results.errors.push({ phase: 'games', error: gameError.message });
      }
    } else {
      console.log('⏩ Skipping game seeding...');
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Determine overall success
    results.success = results.errors.length === 0;

    if (results.success) {
      console.log('\n🎉 ================================');
      console.log('🎉 ALL SEEDING COMPLETED SUCCESSFULLY!');
      console.log(`🎉 Total time: ${duration} seconds`);
      console.log('🎉 ================================\n');
    } else {
      console.log('\n⚠️  ================================');
      console.log('⚠️  SEEDING COMPLETED WITH ERRORS');
      console.log(`⚠️  Total time: ${duration} seconds`);
      console.log(`⚠️  Errors: ${results.errors.length}`);
      results.errors.forEach((err, index) => {
        console.log(`⚠️  ${index + 1}. ${err.phase}: ${err.error}`);
      });
      console.log('⚠️  ================================\n');
    }
    
    return results;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.error('\n❌ ================================');
    console.error('❌ CRITICAL SEEDING FAILURE!');
    console.error('❌ ================================');
    console.error(`❌ Runtime: ${duration} seconds`);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ ================================\n');
    
    results.success = false;
    results.errors.push({ phase: 'critical', error: error.message });
    
    throw error;
  }
}

// Helper function for forced reseeding
async function forceReseedAll() {
  console.log('🔄 FORCING COMPLETE RESEED...\n');
  return await seedAll({ forceReseed: true });
}

// Helper function for partial seeding
async function seedAdminOnly(forceReseed = false) {
  console.log('👑 SEEDING ADMIN ONLY...\n');
  return await seedAll({ skipAnimals: true, skipGames: true, forceReseed });
}

async function seedAnimalsOnly(forceReseed = false) {
  console.log('🦁 SEEDING ANIMALS ONLY...\n');
  return await seedAll({ skipGames: true, skipAdmin: true, forceReseed });
}

async function seedGamesOnly(forceReseed = false) {
  console.log('🎮 SEEDING GAMES ONLY...\n');
  return await seedAll({ skipAnimals: true, skipAdmin: true, forceReseed });
}

// Export both default and named functions
export default seedAll;
export { forceReseedAll, seedAdminOnly, seedAnimalsOnly, seedGamesOnly };