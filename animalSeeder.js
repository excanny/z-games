// animalSeeder.js
import Animal from './src/infrastructure/models/games/Animal.js';
import SeedingTracker from './src/infrastructure/models/SeedingTracker.js';
import crypto from 'crypto';

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

async function seedAnimals(forceReseed = false) {
  console.log('🦁 Starting Animal Seeding Process...');
  
  // Check if seeding has already been completed
  const seedingRecord = await SeedingTracker.findOne({ seedType: 'animals' });
  
  if (seedingRecord && !forceReseed) {
    console.log('✅ Animals already seeded. Checking for missing data...');
    
    // Check for missing animals (deleted data restoration)
    const existingAnimals = await Animal.find({}, 'name');
    const existingNames = existingAnimals.map(a => a.name);
    const expectedNames = animals.map(a => a.name);
    const missingAnimals = animals.filter(animal => !existingNames.includes(animal.name));
    
    if (missingAnimals.length > 0) {
      console.log(`🔄 Found ${missingAnimals.length} missing animals. Restoring...`);
      
      let restoredCount = 0;
      for (const animal of missingAnimals) {
        try {
          await Animal.create(animal);
          console.log(`🔧 Restored: ${animal.name}`);
          restoredCount++;
        } catch (error) {
          console.error(`❌ Failed to restore ${animal.name}:`, error.message);
        }
      }
      
      // Update tracking record
      await SeedingTracker.updateOne(
        { seedType: 'animals' },
        { 
          $set: { 
            lastSeededAt: new Date(),
            itemsSeeded: existingAnimals.length + restoredCount
          }
        }
      );
      
      console.log(`✅ Restored ${restoredCount} missing animals`);
      return { restored: restoredCount, total: existingAnimals.length + restoredCount };
    } else {
      console.log('✅ All animals present. No restoration needed.');
      return { restored: 0, total: existingAnimals.length };
    }
  }
  
  // First time seeding or forced reseed
  console.log(`📊 Processing ${animals.length} animals for initial seeding...`);
  
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
      
      const existing = await Animal.findOne({ name: animal.name });
      if (!existing) {
        await Animal.create(animal);
        console.log(`✅ Seeded: ${animal.name}`);
        newCount++;
      } else {
        await Animal.updateOne({ name: animal.name }, animal);
        console.log(`🔄 Updated: ${animal.name}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${animal.name}:`, error.message);
      errorCount++;
    }
  }

  // Record seeding completion
  await SeedingTracker.findOneAndUpdate(
    { seedType: 'animals' },
    {
      seedType: 'animals',
      lastSeededAt: new Date(),
      version: '1.0.0',
      itemsSeeded: newCount + updatedCount,
      status: errorCount > 0 ? 'completed' : 'completed',
      expectedItems: expectedItems
    },
    { upsert: true, new: true }
  );

  console.log('\n🦁 Animal Seeding Summary:');
  console.log(`📈 New animals created: ${newCount}`);
  console.log(`🔄 Existing animals updated: ${updatedCount}`);
  console.log(`❌ Errors encountered: ${errorCount}`);
  console.log(`📊 Total processed: ${newCount + updatedCount}/${animals.length}`);
  
  if (errorCount === 0) {
    console.log('✅ Animal seeding completed successfully!');
  }

  return { 
    new: newCount, 
    updated: updatedCount, 
    errors: errorCount, 
    total: newCount + updatedCount 
  };
}

export default seedAnimals;