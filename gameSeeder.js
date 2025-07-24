// gameSeeder.js
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { getConnection } from './src/config/db.js';

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

// ===== GAME CODE GENERATION FUNCTIONS =====

/**
 * Converts a game name to a base code using adjective-noun pattern
 * @param {string} gameName - The name of the game
 * @returns {string} A formatted game code base
 */
function generateBaseCodeFromName(gameName) {
  if (!gameName || typeof gameName !== 'string') {
    return 'UnknownGame';
  }

  // Remove common game words and clean the name
  const cleanName = gameName
    .replace(/\s*\([^)]*\)/g, '') // Remove parentheses content
    .replace(/Game|Play|Match|Contest|Challenge/gi, '') // Remove common game words
    .trim();
  
  // Split into words and filter out short/common words
  const words = cleanName
    .split(/[\s-_]+/)
    .filter(word => word && word.length > 2)
    .filter(word => !['the', 'and', 'or', 'but', 'for', 'of', 'a', 'an'].includes(word.toLowerCase()));
  
  // Handle different name patterns
  if (words.length === 0) {
    return 'UnknownGame';
  } else if (words.length === 1) {
    // Single word - add 'Game' as noun
    return `${capitalize(words[0])}Game`;
  } else if (words.length === 2) {
    // Two words - perfect for adjective-noun
    return `${capitalize(words[0])}${capitalize(words[1])}`;
  } else {
    // Multiple words - use first and last, or first two
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    
    // If last word is very short, use second word instead
    if (lastWord.length <= 3 && words.length > 2) {
      return `${capitalize(firstWord)}${capitalize(words[1])}`;
    }
    
    return `${capitalize(firstWord)}${capitalize(lastWord)}`;
  }
}

/**
 * Capitalizes the first letter of a word
 * @param {string} word - Word to capitalize
 * @returns {string} Capitalized word
 */
function capitalize(word) {
  if (!word || typeof word !== 'string') return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Generate checksum for data integrity
function generateChecksum(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Create database connection with retry logic
async function createConnection(retryCount = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const connection = await mysql.createConnection(getConnection());
      // Test the connection
      await connection.ping();
      return connection;
    } catch (error) {
      lastError = error;
      console.warn(`Database connection attempt ${attempt}/${retryCount} failed:`, error.message);
      
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${retryCount} attempts: ${lastError.message}`);
}

// Create tables if they don't exist
async function createTables(connection) {
  const createGamesTable = `
    CREATE TABLE IF NOT EXISTS games (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      game_code VARCHAR(100) NOT NULL UNIQUE,
      type ENUM('team', 'general', 'individual') NOT NULL,
      description TEXT NOT NULL,
      rules JSON NOT NULL,
      point_system JSON NOT NULL,
      prizes JSON NOT NULL,
      time_limit INT NULL,
      max_players INT NULL,
      min_players INT NOT NULL,
      equipment JSON NOT NULL,
      applicable_superpowers JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_game_code (game_code),
      INDEX idx_name (name),
      INDEX idx_type (type)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_seed_type (seed_type)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `;

  await connection.execute(createGamesTable);
  await connection.execute(createSeedingTrackerTable);
  console.log('✅ Database tables created/verified');
}

/**
 * Checks if a game code already exists in the database
 * @param {Object} connection - Database connection
 * @param {string} code - The game code to check
 * @returns {Promise<boolean>} True if code exists, false otherwise
 */
async function gameCodeExists(connection, code) {
  try {
    const [rows] = await connection.execute(
      'SELECT id FROM games WHERE game_code = ? LIMIT 1',
      [code]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking game code existence:', error);
    throw error; // Re-throw to handle upstream
  }
}

/**
 * Generates a unique game code based on the game name
 * @param {Object} connection - Database connection
 * @param {string} gameName - The name of the game
 * @param {number} maxAttempts - Maximum number of attempts to generate unique code
 * @returns {Promise<string>} A unique game code
 */
async function generateUniqueGameCode(connection, gameName, maxAttempts = 50) {
  if (!gameName || typeof gameName !== 'string') {
    throw new Error('Game name is required and must be a string');
  }
  
  const baseCode = generateBaseCodeFromName(gameName);
  let uniqueCode = baseCode;
  
  // Check if base code is available
  if (!(await gameCodeExists(connection, uniqueCode))) {
    console.log(`✅ Generated unique game code for "${gameName}": ${uniqueCode}`);
    return uniqueCode;
  }
  
  // If base code exists, try adding numbers starting from 2
  for (let suffix = 2; suffix <= maxAttempts + 1; suffix++) {
    uniqueCode = `${baseCode}${suffix}`;
    
    if (!(await gameCodeExists(connection, uniqueCode))) {
      console.log(`✅ Generated unique game code for "${gameName}": ${uniqueCode} (attempt ${suffix - 1})`);
      return uniqueCode;
    }
  }
  
  // Fallback: use timestamp-based suffix
  const timestamp = Date.now().toString().slice(-4);
  const fallbackCode = `${baseCode}${timestamp}`;
  
  // Final check for fallback code
  if (!(await gameCodeExists(connection, fallbackCode))) {
    console.warn(`⚠️  Using timestamp-based code for "${gameName}": ${fallbackCode}`);
    return fallbackCode;
  }
  
  // Ultimate fallback with random hash
  const randomHash = crypto.randomBytes(2).toString('hex').toUpperCase();
  const ultimateCode = `${baseCode}${randomHash}`;
  
  console.warn(`⚠️  Using random hash code for "${gameName}": ${ultimateCode}`);
  return ultimateCode;
}

// Check if game exists by name
async function findGameByName(connection, name) {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM games WHERE name = ? LIMIT 1',
      [name]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding game by name:', error);
    throw error;
  }
}

// Get all games
async function getAllGames(connection) {
  try {
    const [rows] = await connection.execute('SELECT id, name, game_code FROM games ORDER BY name');
    return rows;
  } catch (error) {
    console.error('Error getting all games:', error);
    throw error;
  }
}

// Create new game with transaction
async function createGame(connection, game) {
  const query = `
    INSERT INTO games (
      name, game_code, type, description, rules, point_system, 
      prizes, time_limit, max_players, min_players, equipment, applicable_superpowers
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  try {
    await connection.execute(query, [
      game.name,
      game.gameCode,
      game.type,
      game.description,
      JSON.stringify(game.rules),
      JSON.stringify(game.pointSystem),
      JSON.stringify(game.prizes),
      game.timeLimit,
      game.maxPlayers,
      game.minPlayers,
      JSON.stringify(game.equipment),
      JSON.stringify(game.applicableSuperpowers)
    ]);
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}

// Update existing game with transaction
async function updateGame(connection, game) {
  const query = `
    UPDATE games 
    SET game_code = ?, type = ?, description = ?, rules = ?, point_system = ?, 
        prizes = ?, time_limit = ?, max_players = ?, min_players = ?, 
        equipment = ?, applicable_superpowers = ?, updated_at = CURRENT_TIMESTAMP
    WHERE name = ?
  `;
  
  try {
    const [result] = await connection.execute(query, [
      game.gameCode,
      game.type,
      game.description,
      JSON.stringify(game.rules),
      JSON.stringify(game.pointSystem),
      JSON.stringify(game.prizes),
      game.timeLimit,
      game.maxPlayers,
      game.minPlayers,
      JSON.stringify(game.equipment),
      JSON.stringify(game.applicableSuperpowers),
      game.name
    ]);
    
    if (result.affectedRows === 0) {
      throw new Error(`No game found with name: ${game.name}`);
    }
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
}

// Update game code only
async function updateGameCode(connection, gameId, gameCode) {
  try {
    const [result] = await connection.execute(
      'UPDATE games SET game_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [gameCode, gameId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error(`No game found with ID: ${gameId}`);
    }
  } catch (error) {
    console.error('Error updating game code:', error);
    throw error;
  }
}

// Get seeding tracker record
async function getSeedingTracker(connection, seedType) {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM seeding_tracker WHERE seed_type = ? LIMIT 1',
      [seedType]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting seeding tracker:', error);
    throw error;
  }
}

// Update seeding tracker with better error handling
async function updateSeedingTracker(connection, data) {
  const query = `
    INSERT INTO seeding_tracker (seed_type, last_seeded_at, version, items_seeded, status, expected_items)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    last_seeded_at = VALUES(last_seeded_at),
    items_seeded = VALUES(items_seeded),
    status = VALUES(status),
    expected_items = VALUES(expected_items),
    updated_at = CURRENT_TIMESTAMP
  `;
  
  try {
    await connection.execute(query, [
      data.seedType,
      data.lastSeededAt,
      data.version || '1.0.0',
      data.itemsSeeded,
      data.status,
      JSON.stringify(data.expectedItems || [])
    ]);
  } catch (error) {
    console.error('Error updating seeding tracker:', error);
    throw error;
  }
}

// Validate game data
function validateGameData(game) {
  const errors = [];
  
  if (!game.name || typeof game.name !== 'string' || game.name.trim().length === 0) {
    errors.push('Game name is required and must be a non-empty string');
  }
  
  if (!['team', 'general', 'individual'].includes(game.type)) {
    errors.push('Game type must be one of: team, general, individual');
  }
  
  if (!game.description || typeof game.description !== 'string' || game.description.trim().length === 0) {
    errors.push('Game description is required and must be a non-empty string');
  }
  
  if (!Array.isArray(game.rules) || game.rules.length === 0) {
    errors.push('Game rules must be a non-empty array');
  }
  
  if (!game.pointSystem || typeof game.pointSystem !== 'object') {
    errors.push('Point system is required and must be an object');
  }
  
  if (!Number.isInteger(game.minPlayers) || game.minPlayers < 1) {
    errors.push('Minimum players must be a positive integer');
  }
  
  if (game.maxPlayers !== null && (!Number.isInteger(game.maxPlayers) || game.maxPlayers < game.minPlayers)) {
    errors.push('Maximum players must be null or an integer greater than or equal to minimum players');
  }
  
  if (game.timeLimit !== null && (!Number.isInteger(game.timeLimit) || game.timeLimit < 1)) {
    errors.push('Time limit must be null or a positive integer');
  }
  
  if (!Array.isArray(game.equipment)) {
    errors.push('Equipment must be an array');
  }
  
  if (!Array.isArray(game.applicableSuperpowers)) {
    errors.push('Applicable superpowers must be an array');
  }
  
  if (!Array.isArray(game.prizes)) {
    errors.push('Prizes must be an array');
  }
  
  return errors;
}

async function seedGames(forceReseed = false) {
  let connection;
  
  try {
    console.log('🎮 Starting Game Seeding Process...');
    console.log(`📊 Processing ${games.length} games...`);
    
    // Create database connection with retry logic
    connection = await createConnection();
    console.log('✅ Database connection established');
    
    // Begin transaction for data consistency
    await connection.beginTransaction();
    
    try {
      // Create tables if they don't exist
      await createTables(connection);
      
      // Check if seeding has already been completed
      const seedingRecord = await getSeedingTracker(connection, 'games');
      
      if (seedingRecord && !forceReseed) {
        console.log('✅ Games already seeded. Checking for missing data...');
        
        // Check for missing games (deleted data restoration)
        const existingGames = await getAllGames(connection);
        const existingNames = new Set(existingGames.map(g => g.name));
        const missingGames = games.filter(game => !existingNames.has(game.name));
        
        if (missingGames.length > 0) {
          console.log(`🔄 Found ${missingGames.length} missing games. Restoring...`);
          
          let restoredCount = 0;
          for (const game of missingGames) {
            try {
              // Validate game data before processing
              const validationErrors = validateGameData(game);
              if (validationErrors.length > 0) {
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
              }
              
              // Generate unique game code for restored game
              const gameCode = await generateUniqueGameCode(connection, game.name);
              const gameWithCode = { ...game, gameCode };
              
              await createGame(connection, gameWithCode);
              console.log(`🔧 Restored: ${game.name} (Code: ${gameCode})`);
              restoredCount++;
            } catch (error) {
              console.error(`❌ Failed to restore ${game.name}:`, error.message);
            }
          }
          
          // Update tracking record
          await updateSeedingTracker(connection, {
            seedType: 'games',
            lastSeededAt: new Date(),
            version: '1.0.0',
            itemsSeeded: existingGames.length + restoredCount,
            status: 'completed',
            expectedItems: []
          });
          
          await connection.commit();
          console.log(`✅ Restored ${restoredCount} missing games`);
          return { restored: restoredCount, total: existingGames.length + restoredCount };
        } else {
          console.log('✅ All games present. Checking for missing game codes...');
          
          // Check for games missing game codes and add them
          const gamesWithoutCodes = existingGames.filter(g => !g.game_code);
          if (gamesWithoutCodes.length > 0) {
            console.log(`🔄 Adding game codes to ${gamesWithoutCodes.length} existing games...`);
            
            for (const game of gamesWithoutCodes) {
              try {
                const gameCode = await generateUniqueGameCode(connection, game.name);
                await updateGameCode(connection, game.id, gameCode);
                console.log(`🔧 Added code to "${game.name}": ${gameCode}`);
              } catch (error) {
                console.error(`❌ Failed to add code to ${game.name}:`, error.message);
              }
            }
          }
          
          await connection.commit();
          console.log('✅ No restoration needed.');
          return { restored: 0, total: existingGames.length };
        }
      }
      
      // First time seeding or forced reseed
      console.log(`📊 Processing ${games.length} games for ${forceReseed ? 'forced re-seeding' : 'initial seeding'}...`);
      
      let newCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const expectedItems = [];
      const errors = [];

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        try {
          console.log(`[${i + 1}/${games.length}] Processing: ${game.name}`);
          
          // Validate game data
          const validationErrors = validateGameData(game);
          if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
          }
          
          // Generate unique game code
          const gameCode = await generateUniqueGameCode(connection, game.name);
          const gameWithCode = { ...game, gameCode };
          
          const checksum = generateChecksum(gameWithCode);
          expectedItems.push({
            name: game.name,
            type: 'game',
            checksum: checksum,
            gameCode: gameCode
          });
          
          const existing = await findGameByName(connection, game.name);
          if (!existing) {
            await createGame(connection, gameWithCode);
            console.log(`✅ Seeded: ${game.name} (Code: ${gameCode})`);
            newCount++;
          } else {
            await updateGame(connection, gameWithCode);
            console.log(`🔄 Updated: ${game.name} (Code: ${gameCode})`);
            updatedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing ${game.name}:`, error.message);
          errors.push({ game: game.name, error: error.message });
          errorCount++;
        }
      }

      // Record seeding completion
      await updateSeedingTracker(connection, {
        seedType: 'games',
        lastSeededAt: new Date(),
        version: '1.0.0',
        itemsSeeded: newCount + updatedCount,
        status: errorCount > 0 ? 'partial' : 'completed',
        expectedItems: expectedItems
      });

      await connection.commit();

      console.log('\n🎮 Game Seeding Summary:');
      console.log(`📈 New games created: ${newCount}`);
      console.log(`🔄 Existing games updated: ${updatedCount}`);
      console.log(`❌ Errors encountered: ${errorCount}`);
      console.log(`📊 Total processed: ${newCount + updatedCount}/${games.length}`);
      
      if (errorCount > 0) {
        console.log('\n❌ Errors details:');
        errors.forEach(err => {
          console.log(`   - ${err.game}: ${err.error}`);
        });
      }
      
      if (errorCount === 0) {
        console.log('✅ Game seeding completed successfully!');
      } else {
        console.log('⚠️  Game seeding completed with some errors. Check logs above.');
      }

      return { 
        new: newCount, 
        updated: updatedCount, 
        errors: errorCount, 
        total: newCount + updatedCount,
        errorDetails: errors
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    
    // Update seeding tracker with failure status
    if (connection) {
      try {
        await updateSeedingTracker(connection, {
          seedType: 'games',
          lastSeededAt: new Date(),
          version: '1.0.0',
          itemsSeeded: 0,
          status: 'failed',
          expectedItems: []
        });
      } catch (trackerError) {
        console.error('❌ Failed to update seeding tracker:', trackerError);
      }
    }
    
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Database connection closed');
      } catch (closeError) {
        console.error('⚠️  Error closing database connection:', closeError);
      }
    }
  }
}

// Utility function to run seeding with command line arguments
async function runSeeding() {
  const args = process.argv.slice(2);
  const forceReseed = args.includes('--force') || args.includes('-f');
  
  try {
    console.log('🚀 Starting game seeding process...');
    if (forceReseed) {
      console.log('⚠️  Force reseed mode enabled - will overwrite existing data');
    }
    
    const result = await seedGames(forceReseed);
    
    console.log('\n✅ Seeding process completed successfully!');
    console.log('📊 Final Results:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  }
}

// Export functions and games array
export { 
  games, 
  generateUniqueGameCode, 
  generateBaseCodeFromName, 
  validateGameData,
  createConnection,
  runSeeding
};

export default seedGames;

// If this file is run directly, execute the seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeding();
}