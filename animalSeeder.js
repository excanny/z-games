// animalSeeder.js
import crypto from 'crypto';
import { getConnection } from './src/config/db.js';

const animals = [
  {
    name: 'Lion',
    superpower: {
      description: 'Has authority to take out three words from the forbidden words throughout the game',
      applicableGames: ['Charades'],
      usageLimit: 3,
      specialRules: 'Can remove forbidden words during charades rounds'
    }
  },
  {
    name: 'Tiger',
    superpower: {
      description: 'Has authority to take out three words from the forbidden words throughout the game',
      applicableGames: ['Charades'],
      usageLimit: 3,
      specialRules: 'Can remove forbidden words during charades rounds'
    }
  },
  {
    name: 'Eagle',
    superpower: {
      description: 'The eagle has authority to get back in the game 3 times',
      applicableGames: ['Lemon Lemon'],
      usageLimit: 3,
      specialRules: 'Can rejoin after elimination'
    }
  },
  {
    name: 'Cat',
    superpower: {
      description: 'Has the authority to use up to 8 extra shots after missing a shot',
      applicableGames: ['Ball Pong'],
      usageLimit: 8,
      specialRules: 'Must catwalk and meow every time returning for extra shot'
    }
  },
  {
    name: 'Shark',
    superpower: {
      description: 'Can exchange points with opponent',
      applicableGames: ['Ball Pong'],
      usageLimit: null,
      specialRules: 'Can swap points with any opponent'
    }
  },
  {
    name: 'Dog',
    superpower: {
      description: 'Can pass on the dice instruction to someone else to perform the task',
      applicableGames: ['Dice'],
      usageLimit: 3,
      specialRules: 'Can delegate dice challenges to other players'
    }
  },
  {
    name: 'Whale',
    superpower: {
      description: 'Automatically gets 6 points from opposing team when anyone throws a 6',
      applicableGames: ['Dice'],
      usageLimit: null,
      specialRules: 'Gains points whenever any player rolls a 6'
    }
  },
  {
    name: 'Horse',
    superpower: {
      description: 'Play rock paper scissors to win and receive 12 additional points',
      applicableGames: ['Dice'],
      usageLimit: null,
      specialRules: 'Must win rock paper scissors to gain bonus points'
    }
  },
  {
    name: 'Bison',
    superpower: {
      description: 'Ability to get back in the game 3 times',
      applicableGames: ['Shadowboxing'],
      usageLimit: 3,
      specialRules: 'Can rejoin shadowboxing after losing'
    }
  },
  {
    name: 'Moose',
    superpower: {
      description: 'Ability to swap the shadowboxer two times',
      applicableGames: ['Shadowboxing'],
      usageLimit: 2,
      specialRules: 'Can change who is the active shadowboxer'
    }
  },
  {
    name: 'Goose',
    superpower: {
      description: 'Allowed to move forward and adjust rubber 3 times after throwing',
      applicableGames: ['Rubber Band Game'],
      usageLimit: 3,
      specialRules: 'Can reposition rubber bands after throwing'
    }
  },
  {
    name: 'Turtle',
    superpower: {
      description: 'Allowed to move closer to the target to throw 3 times',
      applicableGames: ['Rubber Band Game'],
      usageLimit: 3,
      specialRules: 'Can move closer to target before throwing'
    }
  },
  {
    name: 'Beaver',
    superpower: {
      description: 'Can pause opponent from stacking for 10 seconds',
      applicableGames: ['Cup Stacking'],
      usageLimit: 2,
      specialRules: 'Can freeze opponents during cup stacking'
    }
  },
  {
    name: 'Bear',
    superpower: {
      description: 'Can scatter opponents cups',
      applicableGames: ['Cup Stacking'],
      usageLimit: 2,
      specialRules: 'Can knock down opponent cup towers'
    }
  },
  {
    name: 'Frog',
    superpower: {
      description: 'Allowed to move forward 3 steps throughout game',
      applicableGames: ['Basketball'],
      usageLimit: 3,
      specialRules: 'Can advance position during basketball shooting'
    }
  },
  {
    name: 'Rabbit',
    superpower: {
      description: 'Allowed to smack the ball off the hoops thrice',
      applicableGames: ['Basketball'],
      usageLimit: 3,
      specialRules: 'Can interfere with opponent shots'
    }
  },
  {
    name: 'Wolf',
    superpower: {
      description: 'Ability to open eyes once in the entire game',
      applicableGames: ['Werewolf'],
      usageLimit: 1,
      specialRules: 'Can peek during night phase once per game'
    }
  },
  {
    name: 'Human',
    superpower: {
      description: 'Cannot collect points from them except during the random dance by monkey',
      applicableGames: ['All'],
      usageLimit: null,
      specialRules: 'Immune to point theft except during monkey dance'
    }
  },
  {
    name: 'Monkey',
    superpower: {
      description: 'Can steal points at the stop time of dance - 5 points per person',
      applicableGames: ['Dance', 'All'],
      usageLimit: null,
      specialRules: 'Triggers monkey dance events, can steal 5 points per victim'
    }
  },
  {
    name: 'Chameleon',
    superpower: {
      description: 'Switch teams twice',
      applicableGames: ['All'],
      usageLimit: 2,
      specialRules: 'Can change team affiliation during games'
    }
  }
];

// Generate checksum for data integrity
function generateChecksum(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Create database connection using the imported getConnection function
async function createConnection() {
  return await getConnection();
}

// Create tables if they don't exist
async function createTables(connection) {
  const createAnimalsTable = `
    CREATE TABLE IF NOT EXISTS animals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      superpower_description TEXT NOT NULL,
      applicable_games JSON NOT NULL,
      usage_limit INT NULL,
      special_rules TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const createSeedingTrackerTable = `
    CREATE TABLE IF NOT EXISTS seeding_tracker (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seed_type VARCHAR(50) NOT NULL UNIQUE,
      last_seeded_at TIMESTAMP NOT NULL,
      version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
      items_seeded INT NOT NULL DEFAULT 0,
      status ENUM('completed', 'partial', 'failed') NOT NULL DEFAULT 'completed',
      expected_items JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  await connection.execute(createAnimalsTable);
  await connection.execute(createSeedingTrackerTable);
  console.log('✅ Database tables created/verified');
}

// Check if animal exists
async function findAnimalByName(connection, name) {
  const [rows] = await connection.execute(
    'SELECT * FROM animals WHERE name = ?',
    [name]
  );
  return rows[0] || null;
}

// Get all animals
async function getAllAnimals(connection) {
  const [rows] = await connection.execute('SELECT name FROM animals');
  return rows;
}

// Create new animal
async function createAnimal(connection, animal) {
  const { name, superpower } = animal;
  const query = `
    INSERT INTO animals (name, superpower_description, applicable_games, usage_limit, special_rules)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  await connection.execute(query, [
    name,
    superpower.description,
    JSON.stringify(superpower.applicableGames),
    superpower.usageLimit,
    superpower.specialRules
  ]);
}

// Update existing animal
async function updateAnimal(connection, animal) {
  const { name, superpower } = animal;
  const query = `
    UPDATE animals 
    SET superpower_description = ?, applicable_games = ?, usage_limit = ?, special_rules = ?, updated_at = CURRENT_TIMESTAMP
    WHERE name = ?
  `;
  
  await connection.execute(query, [
    superpower.description,
    JSON.stringify(superpower.applicableGames),
    superpower.usageLimit,
    superpower.specialRules,
    name
  ]);
}

// Get seeding tracker record
async function getSeedingTracker(connection, seedType) {
  const [rows] = await connection.execute(
    'SELECT * FROM seeding_tracker WHERE seed_type = ?',
    [seedType]
  );
  return rows[0] || null;
}

// Update seeding tracker
async function updateSeedingTracker(connection, data) {
  const query = `
    INSERT INTO seeding_tracker (seed_type, last_seeded_at, version, items_seeded, status, expected_items)
    VALUES (?, NOW(), ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    last_seeded_at = NOW(),
    items_seeded = VALUES(items_seeded),
    status = VALUES(status),
    expected_items = VALUES(expected_items),
    updated_at = CURRENT_TIMESTAMP
  `;
  
  await connection.execute(query, [
    data.seedType,
    data.version,
    data.itemsSeeded,
    data.status,
    JSON.stringify(data.expectedItems)
  ]);
}

async function seedAnimals(forceReseed = false) {
  let connection;
  
  try {
    console.log('🦁 Starting Animal Seeding Process...');
    
    // Create database connection using imported function
    connection = await createConnection();
    console.log('✅ Database connection established');
    
    // Create tables if they don't exist
    await createTables(connection);
    
    // Check if seeding has already been completed
    const seedingRecord = await getSeedingTracker(connection, 'animals');
    
    if (seedingRecord && !forceReseed) {
      console.log('✅ Animals already seeded. Checking for missing data...');
      
      // Check for missing animals (deleted data restoration)
      const existingAnimals = await getAllAnimals(connection);
      const existingNames = existingAnimals.map(a => a.name);
      const missingAnimals = animals.filter(animal => !existingNames.includes(animal.name));
      
      if (missingAnimals.length > 0) {
        console.log(`🔄 Found ${missingAnimals.length} missing animals. Restoring...`);
        
        let restoredCount = 0;
        for (const animal of missingAnimals) {
          try {
            await createAnimal(connection, animal);
            console.log(`🔧 Restored: ${animal.name}`);
            restoredCount++;
          } catch (error) {
            console.error(`❌ Failed to restore ${animal.name}:`, error.message);
          }
        }
        
        // Update tracking record
        await updateSeedingTracker(connection, {
          seedType: 'animals',
          version: '1.0.0',
          itemsSeeded: existingAnimals.length + restoredCount,
          status: 'completed',
          expectedItems: animals.map(a => ({ name: a.name, type: 'animal', checksum: generateChecksum(a) }))
        });
        
        console.log(`✅ Restored ${restoredCount} missing animals`);
        return { 
          restored: restoredCount, 
          total: existingAnimals.length + restoredCount,
          new: 0,
          updated: 0,
          errors: 0
        };
      } else {
        console.log('✅ All animals present. No restoration needed.');
        return { 
          restored: 0, 
          total: existingAnimals.length,
          new: 0,
          updated: 0,
          errors: 0
        };
      }
    }
    
    // First time seeding or forced reseed
    console.log(`📊 Processing ${animals.length} animals for ${forceReseed ? 'forced re-seeding' : 'initial seeding'}...`);
    
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const expectedItems = [];

    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      try {
        console.log(`[${i + 1}/${animals.length}] Processing: ${animal.name}`);
        
        const checksum = generateChecksum(animal);
        expectedItems.push({
          name: animal.name,
          type: 'animal',
          checksum: checksum
        });
        
        const existing = await findAnimalByName(connection, animal.name);
        if (!existing || forceReseed) {
          if (existing && forceReseed) {
            await updateAnimal(connection, animal);
            console.log(`🔄 Force updated: ${animal.name}`);
            updatedCount++;
          } else {
            await createAnimal(connection, animal);
            console.log(`✅ Created: ${animal.name}`);
            newCount++;
          }
        } else {
          // Check if data needs updating by comparing checksums
          const existingChecksum = generateChecksum({
            name: existing.name,
            superpower: {
              description: existing.superpower_description,
              applicableGames: JSON.parse(existing.applicable_games),
              usageLimit: existing.usage_limit,
              specialRules: existing.special_rules
            }
          });
          
          if (existingChecksum !== checksum) {
            await updateAnimal(connection, animal);
            console.log(`🔄 Updated: ${animal.name}`);
            updatedCount++;
          } else {
            console.log(`⏭️  Skipped (no changes): ${animal.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${animal.name}:`, error.message);
        errorCount++;
      }
    }

    // Record seeding completion
    await updateSeedingTracker(connection, {
      seedType: 'animals',
      version: '1.0.0',
      itemsSeeded: newCount + updatedCount,
      status: errorCount > 0 ? 'partial' : 'completed',
      expectedItems: expectedItems
    });

    console.log('\n🦁 Animal Seeding Summary:');
    console.log(`📈 New animals created: ${newCount}`);
    console.log(`🔄 Existing animals updated: ${updatedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📊 Total processed: ${newCount + updatedCount}/${animals.length}`);
    
    if (errorCount === 0) {
      console.log('✅ Animal seeding completed successfully!');
    } else {
      console.log('⚠️  Animal seeding completed with some errors!');
    }

    return { 
      new: newCount, 
      updated: updatedCount, 
      errors: errorCount, 
      total: newCount + updatedCount,
      restored: 0
    };
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    
    // Try to update seeding tracker with failed status
    if (connection) {
      try {
        await updateSeedingTracker(connection, {
          seedType: 'animals',
          version: '1.0.0',
          itemsSeeded: 0,
          status: 'failed',
          expectedItems: []
        });
      } catch (trackerError) {
        console.error('❌ Failed to update seeding tracker:', trackerError.message);
      }
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Export the seeding function
export { seedAnimals };
export default seedAnimals;