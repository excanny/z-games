// Seed game data
export async function up(connection) {
    console.log('   🎮 Seeding game data...');
    
    const games = [
        {
            title: 'Animal Quiz Master',
            description: 'Test your knowledge about different animals and their habitats.',
            game_type: 'quiz',
            difficulty_level: 'easy',
            estimated_duration: 300,
            rules: JSON.stringify({
                questions: 10,
                timePerQuestion: 30,
                scoringSystem: 'standard'
            }),
            scoring_system: JSON.stringify({
                correctAnswer: 10,
                timeBonus: 5,
                streakMultiplier: 1.5
            })
        },
        {
            title: 'Wildlife Memory Challenge',
            description: 'Match pairs of animals and test your memory skills.',
            game_type: 'memory',
            difficulty_level: 'medium',
            estimated_duration: 180,
            rules: JSON.stringify({
                pairs: 8,
                timeLimit: 180,
                maxAttempts: 20
            }),
            scoring_system: JSON.stringify({
                matchBonus: 20,
                timeBonus: 10,
                attemptPenalty: -2
            })
        },
        {
            title: 'Safari Puzzle Adventure',
            description: 'Solve animal-themed puzzles and learn fascinating facts.',
            game_type: 'puzzle',
            difficulty_level: 'hard',
            estimated_duration: 600,
            rules: JSON.stringify({
                puzzlePieces: 16,
                hints: 3,
                timeLimit: 600
            }),
            scoring_system: JSON.stringify({
                completionBonus: 100,
                hintPenalty: -10,
                timeBonus: 50
            })
        }
    ];
    
    for (const game of games) {
        // Check if game already exists
        const [existing] = await connection.execute(
            'SELECT id FROM games WHERE title = ?',
            [game.title]
        );
        
        if (existing.length === 0) {
            await connection.execute(`
                INSERT INTO games (title, description, game_type, difficulty_level, estimated_duration, rules, scoring_system)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                game.title,
                game.description,
                game.game_type,
                game.difficulty_level,
                game.estimated_duration,
                game.rules,
                game.scoring_system
            ]);
        }
    }
    
    console.log(`   ✅ Seeded ${games.length} games`);
}