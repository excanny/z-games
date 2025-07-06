// gameSeeder.js
import Game from './src/infrastructure/models/games/Game.js';
import SeedingTracker from './src/infrastructure/models/SeedingTracker.js';
import crypto from 'crypto';

const games = [
  {
    name: 'Charades (Four Words)',
    type: 'team',
    description: 'A 2 team-based charades-style game with a twist — each round centers around an action word, but there are four forbidden words that cannot be used when describing it.',
    rules: [
      'One target word that the team needs to guess',
      'Four forbidden words that cannot be used when giving clues',
      'Describer can speak freely except forbidden words, no gestures or sound effects',
      'If forbidden words are used, round ends immediately with no points',
      'Teams have 1 minute to guess, then opposing team gets 30 seconds for one guess'
    ],
    pointSystem: {
      winPoints: 5,
      bonusPoints: 3,
      penaltyPoints: 0,
      customRules: '5 points for correct guess, 3 bonus points for opposing team if they guess correctly'
    },
    prizes: [],
    timeLimit: 90,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Word cards', 'Timer'],
    applicableSuperpowers: [
      { animal: 'Lion', effect: 'Remove 3 forbidden words throughout game' },
      { animal: 'Tiger', effect: 'Remove 3 forbidden words throughout game' }
    ]
  },
  {
    name: 'Lemon Lemon',
    type: 'general',
    description: 'A fast-paced elimination game where players call out numbers in sequence while saying "Lemon"',
    rules: [
      'Players sit in circle with assigned numbers',
      'Start by saying "Lemon" + own number + another player number',
      'Called player responds with "Lemon" + own number + another player number',
      'Game continues with increasing speed',
      'Players eliminated for hesitation or mistakes',
      'Last two players remaining win'
    ],
    pointSystem: {
      winPoints: 10,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: '10 points each for last two standing'
    },
    prizes: ['$20 gift card each'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: [],
    applicableSuperpowers: [
      { animal: 'Eagle', effect: 'Can get back in game 3 times after elimination' }
    ]
  },
  {
    name: 'Ball Pong',
    type: 'general',
    description: 'Throw ping pong ball at numbered targets to win prizes and points',
    rules: [
      'Throw ping pong ball at target slots numbered 1-12',
      'Receive points equal to slot number plus any prizes in that slot',
      'Each player gets standard number of throws'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Points equal to slot number hit, plus slot prizes'
    },
    prizes: ['Various prizes in numbered slots'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 2,
    equipment: ['Ping pong balls', 'Target board with numbered slots', 'Prizes'],
    applicableSuperpowers: [
      { animal: 'Cat', effect: 'Use up to 8 extra shots after missing (must catwalk and meow)' },
      { animal: 'Shark', effect: 'Can exchange points with opponent' }
    ]
  },
  {
    name: 'Dice',
    type: 'general',
    description: 'Roll dice and complete challenges based on the number rolled',
    rules: [
      'Each team member takes a turn rolling dice',
      'Must complete challenge corresponding to number rolled',
      'Failure to complete challenge may result in penalties',
      'Special rules for certain numbers (6 gives whale points, 5 triggers Kong shout)'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: -5,
      customRules: 'Points based on dice roll and challenge completion'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 2,
    equipment: ['Dice', 'Challenge cards'],
    applicableSuperpowers: [
      { animal: 'Dog', effect: 'Pass dice instruction to someone else 3 times' },
      { animal: 'Whale', effect: 'Gain 6 points when anyone rolls a 6' },
      { animal: 'Horse', effect: 'Play rock paper scissors for 12 bonus points' }
    ]
  },
  {
    name: 'Shadowboxing',
    type: 'individual',
    description: 'A game of quick reflexes - look in opposite direction of where opponent points',
    rules: [
      'Players face each other',
      'One player points in a direction',
      'Other player must look in opposite direction',
      'If you look where opponent points, you lose',
      'Requires quick reflexes and attention'
    ],
    pointSystem: {
      winPoints: 5,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: '5 points for winner'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: 2,
    minPlayers: 2,
    equipment: [],
    applicableSuperpowers: [
      { animal: 'Bison', effect: 'Get back in game 3 times' },
      { animal: 'Moose', effect: 'Swap shadowboxer 2 times' }
    ]
  },
  {
    name: 'Rubber Band Game',
    type: 'team',
    description: 'Throw rubber bands at target, collect overlapping bands for points',
    rules: [
      'Throw rubber bands at target area',
      'Collect rubber bands that overlap with others',
      'Number of collected rubber bands equals points',
      'Team with most rubber bands wins bonus points'
    ],
    pointSystem: {
      winPoints: 20,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Points equal to rubber bands collected, plus 20 bonus points for winning team'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Rubber bands', 'Target area'],
    applicableSuperpowers: [
      { animal: 'Goose', effect: 'Move forward and adjust rubber bands 3 times after throwing' },
      { animal: 'Turtle', effect: 'Move closer to target 3 times' }
    ]
  },
  {
    name: 'Cup Stacking',
    type: 'team',
    description: 'Stack cups in relay fashion in pyramid formation',
    rules: [
      'Stack 10 cups in pyramid: 4-3-2-1 formation',
      'Teams work in relay fashion',
      'First team to complete stacking wins',
      'Must unstack and restack if knocked down'
    ],
    pointSystem: {
      winPoints: 5,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: '5 points each to winning team players'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Cups (10 per team)'],
    applicableSuperpowers: [
      { animal: 'Beaver', effect: 'Pause opponent stacking for 10 seconds, 2 times total' },
      { animal: 'Bear', effect: 'Scatter opponent cups, 2 times total' }
    ]
  },
  {
    name: 'Basketball (Step Forward Step Back)',
    type: 'team',
    description: 'Advance through boxes by making successful shots, go back on misses',
    rules: [
      'Start in first box, advance with successful shots',
      'Miss a shot, go back to previous box',
      'Move through all 3 boxes with successful shots for 3 points',
      'Lose 1 point for each missed basket',
      'If miss first basket, next team member takes turn'
    ],
    pointSystem: {
      winPoints: 3,
      bonusPoints: 0,
      penaltyPoints: -1,
      customRules: '3 points for successful progression, -1 point per miss'
    },
    prizes: ['Random draw prize for final shot makers'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 4,
    equipment: ['Basketball', 'Hoop', 'Floor boxes/markers'],
    applicableSuperpowers: [
      { animal: 'Frog', effect: 'Move forward 3 steps throughout game' },
      { animal: 'Rabbit', effect: 'Smack ball off hoops 3 times' }
    ]
  },
  {
    name: 'Werewolf',
    type: 'general',
    description: 'Classic werewolf elimination game with night and day phases',
    rules: [
      'Night phase: werewolves choose victim to eliminate',
      'Day phase: all players vote to eliminate suspected werewolf',
      'Werewolves win if all villagers eliminated',
      'Villagers win if all werewolves eliminated',
      'Alternates between night and day phases'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Winner determined by team victory'
    },
    prizes: ['3 packs drumstick chicken for villagers', '1 pack for werewolves'],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 6,
    equipment: ['Role cards'],
    applicableSuperpowers: [
      { animal: 'Wolf', effect: 'Open eyes once during night phase per game' }
    ]
  },
  {
    name: 'Just Dance',
    type: 'general',
    description: 'Dance competition following video choreography',
    rules: [
      'Follow dance moves from video',
      'Judges rate performance',
      'Best dancers win points',
      'Monkey can trigger special dance events'
    ],
    pointSystem: {
      winPoints: 0,
      bonusPoints: 0,
      penaltyPoints: 0,
      customRules: 'Points awarded based on performance'
    },
    prizes: [],
    timeLimit: null,
    maxPlayers: null,
    minPlayers: 2,
    equipment: ['Music system', 'Dance videos'],
    applicableSuperpowers: [
      { animal: 'Monkey', effect: 'Trigger monkey dance events to steal points' }
    ]
  }
];

// Generate checksum for data integrity
function generateChecksum(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

async function seedGames(forceReseed = false) {
  console.log('🎮 Starting Game Seeding Process...');
  
  // Check if seeding has already been completed
  const seedingRecord = await SeedingTracker.findOne({ seedType: 'games' });
  
  if (seedingRecord && !forceReseed) {
    console.log('✅ Games already seeded. Checking for missing data...');
    
    // Check for missing games (deleted data restoration)
    const existingGames = await Game.find({}, 'name');
    const existingNames = existingGames.map(g => g.name);
    const expectedNames = games.map(g => g.name);
    const missingGames = games.filter(game => !existingNames.includes(game.name));
    
    if (missingGames.length > 0) {
      console.log(`🔄 Found ${missingGames.length} missing games. Restoring...`);
      
      let restoredCount = 0;
      for (const game of missingGames) {
        try {
          await Game.create(game);
          console.log(`🔧 Restored: ${game.name}`);
          restoredCount++;
        } catch (error) {
          console.error(`❌ Failed to restore ${game.name}:`, error.message);
        }
      }
      
      // Update tracking record
      await SeedingTracker.updateOne(
        { seedType: 'games' },
        { 
          $set: { 
            lastSeededAt: new Date(),
            itemsSeeded: existingGames.length + restoredCount
          }
        }
      );
      
      console.log(`✅ Restored ${restoredCount} missing games`);
      return { restored: restoredCount, total: existingGames.length + restoredCount };
    } else {
      console.log('✅ All games present. No restoration needed.');
      return { restored: 0, total: existingGames.length };
    }
  }
  
  // First time seeding or forced reseed
  console.log(`📊 Processing ${games.length} games for initial seeding...`);
  
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const expectedItems = [];

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    try {
      console.log(`[${i + 1}/${games.length}] Processing: ${game.name}`);
      
      const checksum = generateChecksum(game);
      expectedItems.push({
        name: game.name,
        type: 'game',
        checksum: checksum
      });
      
      const existing = await Game.findOne({ name: game.name });
      if (!existing) {
        await Game.create(game);
        console.log(`✅ Seeded: ${game.name}`);
        newCount++;
      } else {
        await Game.updateOne({ name: game.name }, game);
        console.log(`🔄 Updated: ${game.name}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${game.name}:`, error.message);
      errorCount++;
    }
  }

  // Record seeding completion
  await SeedingTracker.findOneAndUpdate(
    { seedType: 'games' },
    {
      seedType: 'games',
      lastSeededAt: new Date(),
      version: '1.0.0',
      itemsSeeded: newCount + updatedCount,
      status: errorCount > 0 ? 'completed' : 'completed',
      expectedItems: expectedItems
    },
    { upsert: true, new: true }
  );

  console.log('\n🎮 Game Seeding Summary:');
  console.log(`📈 New games created: ${newCount}`);
  console.log(`🔄 Existing games updated: ${updatedCount}`);
  console.log(`❌ Errors encountered: ${errorCount}`);
  console.log(`📊 Total processed: ${newCount + updatedCount}/${games.length}`);
  
  if (errorCount === 0) {
    console.log('✅ Game seeding completed successfully!');
  }

  return { 
    new: newCount, 
    updated: updatedCount, 
    errors: errorCount, 
    total: newCount + updatedCount 
  };
}

export default seedGames;