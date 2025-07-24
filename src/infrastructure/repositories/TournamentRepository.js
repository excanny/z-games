import mysql from 'mysql2/promise';
import dbConfig from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

class TournamentRepository {
  constructor() {
    this.pool = mysql.createPool(dbConfig);
  }

  async connect() {
    try {
      if (!this.pool) {
        this.pool = mysql.createPool(this.config);
        
        // Test the connection
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        
        this.isConnected = true;
       
      }
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
  
    }
  }

  async getConnection() {
    if (!this.pool) {
      await this.connect();
    }
    return await this.pool.getConnection();
  }

  async execute(query, params = []) {
    if (!this.pool) {
      await this.connect();
    }
    return await this.pool.execute(query, params);
  }

// async createTournament(payload) {
//   let connection;
  
//   try {
//     connection = await this.getConnection();
//     await connection.beginTransaction();
    
//     const { tournament, teams, selectedGames } = payload;
    
//     // Generate GUID for tournament
//     const tournamentId = this.generateGUID();
    
//     // First, deactivate all existing tournaments
//     const deactivateQuery = `
//       UPDATE tournaments 
//       SET status = 'inactive' 
//       WHERE status = 'active'
//     `;
//     await connection.execute(deactivateQuery);
    
//     // Create tournament with explicit GUID
//     const tournamentQuery = `
//       INSERT INTO tournaments (
//         id,
//         name, 
//         description, 
//         status
//       ) VALUES (?, ?, ?, ?);
//     `;
    
//     await connection.execute(tournamentQuery, [
//       tournamentId,
//       tournament.name,
//       tournament.description,
//       'active'
//     ]);
    
 

//     // Save selected games to tournament_selected_games
// if (selectedGames && selectedGames.length > 0) {
//   for (const gameId of selectedGames) { // Changed from 'game' to 'gameId'
//     const selectedGameId = this.generateGUID();
    
//     const selectedGameQuery = `
//       INSERT INTO tournament_selected_games (
//         id,
//         game_id,
//         tournament_id
//       ) VALUES (?, ?, ?)
//     `;
    
//     await connection.execute(selectedGameQuery, [
//       selectedGameId,
//       gameId,    
//       tournamentId
//     ]);
//   }
// }
    
//     // Create teams and players
//     for (const team of teams) {
//       // Generate GUID for team
//       const teamId = this.generateGUID();
      
//       // Create team with explicit GUID
//       const teamQuery = `
//         INSERT INTO teams (id, name, tournament_id)
//         VALUES (?, ?, ?)
//       `;
      
//       await connection.execute(teamQuery, [
//         teamId,
//         team.name,
//         tournamentId
//       ]);
      
//       // Create players for this team
//       for (const player of team.players) {
//         // Get animal ID by name/emoji
//         const animalName = this.mapEmojiToAnimalName(player.avatar || player.animalAvatar);
//         const [animalRows] = await connection.execute(
//           'SELECT id FROM animals WHERE name = ?',
//           [animalName]
//         );
        
//         if (animalRows.length === 0) {
//           throw new Error(`Animal not found for: ${animalName}. Available animals: Lion, Tiger, Eagle, Cat, Shark, Dog, Whale, Horse, Bison, Moose, Goose, Turtle, Beaver, Bear, Frog, Rabbit, Wolf, Human, Monkey, Chameleon`);
//         }
        
//         const animalId = animalRows[0].id;
        
//         // Create player
//         const playerQuery = `
//           INSERT INTO players (name, animal_id, team_id, tournament_id)
//           VALUES (?, ?, ?, ?)
//         `;
        
//         await connection.execute(playerQuery, [
//           player.name,
//           animalId,
//           teamId, // Now using the generated GUID
//           tournamentId,
//         ]);
//       }
//     }
    
//     await connection.commit();
    
//     // Return created tournament with details
//     const createdTournament = await this.findById(tournamentId);
//     return createdTournament;
    
//   } catch (error) {
//     if (connection) {
//       await connection.rollback();
//     }
//     throw new Error(`Error creating tournament: ${error.message}`);
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// }

async createTournament(payload) {
  let connection;
  
  try {
    connection = await this.getConnection();
    await connection.beginTransaction();
    
    const { tournament, teams, selectedGames } = payload;
    
    // Generate UUID for tournament
    const tournamentId = uuidv4();
    
    // First, deactivate all existing tournaments
    const deactivateQuery = `
      UPDATE tournaments 
      SET status = 'inactive' 
      WHERE status = 'active'
    `;
    await connection.execute(deactivateQuery);
    
    // Create tournament with explicit UUID
    const tournamentQuery = `
      INSERT INTO tournaments (
        id,
        name, 
        description, 
        status
      ) VALUES (?, ?, ?, ?);
    `;
    
    await connection.execute(tournamentQuery, [
      tournamentId,
      tournament.name,
      tournament.description,
      'active'
    ]);
    
    // Save selected games to tournament_selected_games
    if (selectedGames && selectedGames.length > 0) {
      for (const gameId of selectedGames) {
        const selectedGameId = uuidv4();
        
        const selectedGameQuery = `
          INSERT INTO tournament_selected_games (
            id,
            game_id,
            tournament_id
          ) VALUES (?, ?, ?)
        `;
        
        await connection.execute(selectedGameQuery, [
          selectedGameId,
          gameId,
          tournamentId
        ]);
      }
    }
    
    // Create teams and players
    for (const team of teams) {
      // Generate UUID for team
      const teamId = uuidv4();
      
      // Create team with explicit UUID
      const teamQuery = `
        INSERT INTO teams (id, name, tournament_id)
        VALUES (?, ?, ?)
      `;
      
      await connection.execute(teamQuery, [
        teamId,
        team.name,
        tournamentId
      ]);
      
      // Create players for this team
      for (const player of team.players) {
        // Get animal ID by name/emoji
        const animalName = this.mapEmojiToAnimalName(player.avatar || player.animalAvatar);
        const [animalRows] = await connection.execute(
          'SELECT id FROM animals WHERE name = ?',
          [animalName]
        );
        
        if (animalRows.length === 0) {
          throw new Error(`Animal not found for: ${animalName}. Available animals: Lion, Tiger, Eagle, Cat, Shark, Dog, Whale, Horse, Bison, Moose, Goose, Turtle, Beaver, Bear, Frog, Rabbit, Wolf, Human, Monkey, Chameleon`);
        }
        
        const animalId = animalRows[0].id;
        
        // Create player
        const playerQuery = `
          INSERT INTO players (id, name, animal_id, team_id, tournament_id)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        await connection.execute(playerQuery, [
          uuidv4(),
          player.name,
          animalId,
          teamId,
          tournamentId,
        ]);
      }
    }
    
    await connection.commit();
    
    // Return created tournament with details
    const createdTournament = await this.findById(tournamentId);
    return createdTournament;
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw new Error(`Error creating tournament: ${error.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

  // Helper method to map emojis to animal nam
  
  mapEmojiToAnimalName(emoji) {
    const emojiToAnimal = {
      '🦁': 'Lion',
      '🐯': 'Tiger',
      '🦅': 'Eagle',
      '🐱': 'Cat',
      '🦈': 'Shark',
      '🐶': 'Dog',
      '🐋': 'Whale',
      '🐴': 'Horse',
      '🦬': 'Bison',
      '🫎': 'Moose',
      '🪿': 'Goose',
      '🐢': 'Turtle',
      '🦫': 'Beaver',
      '🐻': 'Bear',
      '🐸': 'Frog',
      '🐰': 'Rabbit',
      '🐺': 'Wolf',
      '👤': 'Human',
      '🐵': 'Monkey',
      '🦎': 'Chameleon'
    };
    
    // If it's already a valid animal name, return it
    const validAnimals = ['Lion', 'Tiger', 'Eagle', 'Cat', 'Shark', 'Dog', 'Whale', 'Horse', 'Bison', 'Moose', 'Goose', 'Turtle', 'Beaver', 'Bear', 'Frog', 'Rabbit', 'Wolf', 'Human', 'Monkey', 'Chameleon'];
    if (validAnimals.includes(emoji)) {
      return emoji;
    }
    
    // Map emoji to animal name
    return emojiToAnimal[emoji] || 'Cat'; // Default to Cat if not found
  }

  async addTeam(tournamentId, teamName) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if tournament exists
      const [tournamentRows] = await connection.execute(
        'SELECT id FROM tournaments WHERE id = ?',
        [tournamentId]
      );
      
      if (tournamentRows.length === 0) {
        throw new Error('Tournament not found');
      }

      // Check if team already exists in tournament
      const [existingTeamRows] = await connection.execute(
        'SELECT id FROM teams WHERE name = ? AND tournament_id = ?',
        [teamName, tournamentId]
      );
      
      if (existingTeamRows.length > 0) {
        throw new Error('Team already exists in this tournament');
      }

      // Create new team
      const teamQuery = `
        INSERT INTO teams (name, tournament_id, created_at, updated_at)
        VALUES (?, ?, NOW(), NOW())
      `;
      
      await connection.execute(teamQuery, [
        teamName,
        tournamentId
      ]);

      await connection.commit();
      
      // Return updated tournament with teams
      const updatedTournament = await this.findById(tournamentId);
      return updatedTournament;
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error adding team: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async updateTeam(tournamentId, teamId, newTeamName) {
  const connection = await this.getConnection();

  try {
    await connection.beginTransaction();

    // Check if tournament exists
    const [tournamentRows] = await connection.execute(
      'SELECT id FROM tournaments WHERE id = ?',
      [tournamentId]
    );

    if (tournamentRows.length === 0) {
      throw new Error('Tournament not found');
    }

    // Check if team exists in the tournament
    const [teamRows] = await connection.execute(
      'SELECT id FROM teams WHERE id = ? AND tournament_id = ?',
      [teamId, tournamentId]
    );

    if (teamRows.length === 0) {
      throw new Error('Team not found in this tournament');
    }

    // Check if new team name already exists (avoid duplicates)
    const [existingTeamRows] = await connection.execute(
      'SELECT id FROM teams WHERE name = ? AND tournament_id = ? AND id != ?',
      [newTeamName, tournamentId, teamId]
    );

    if (existingTeamRows.length > 0) {
      throw new Error('Another team with this name already exists in the tournament');
    }

    // Update the team name
    const updateQuery = `
      UPDATE teams 
      SET name = ?, updated_at = NOW() 
      WHERE id = ? AND tournament_id = ?
    `;

    await connection.execute(updateQuery, [newTeamName, teamId, tournamentId]);

    await connection.commit();

    // Return updated tournament with teams
    const updatedTournament = await this.findById(tournamentId);
    return updatedTournament;

  } catch (error) {
    await connection.rollback();
    throw new Error(`Error updating team: ${error.message}`);
  } finally {
    connection.release();
  }
}


// async updateTournamentStatus(tournamentId, status) {
//   const connection = await this.getConnection();
  
//   try {
//     await connection.beginTransaction();
    
//     // Check if tournament exists
//     const [tournamentRows] = await connection.execute(
//       'SELECT id FROM tournaments WHERE id = ?',
//       [tournamentId]
//     );
    
//     if (tournamentRows.length === 0) {
//       throw new Error('Tournament not found');
//     }

//     // If activating this tournament, first deactivate all other tournaments
//     if (status === 'active') {
//       await connection.execute(
//         'UPDATE tournaments SET status = "inactive", updated_at = NOW() WHERE id != ?',
//         [tournamentId]
//       );
//     }

//     // Update the current tournament status
//     await connection.execute(
//       'UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id = ?',
//       [status, tournamentId]
//     );

//     await connection.commit();
    
//     const tournament = await this.findById(tournamentId);
//     return tournament;
    
//   } catch (error) {
//     await connection.rollback();
//     throw new Error(`Error updating tournament status: ${error.message}`);
//   } finally {
//     connection.release();
//   }
// }


async updateTournamentStatus(tournamentId, status) {
  // Validate input parameters
  if (!tournamentId) {
    throw new Error('Tournament ID is required');
  }
  
  if (!status) {
    throw new Error('Status is required');
  }

  // Define valid status values - now that you're using varchar(50), these are flexible
  const validStatuses = ['active', 'inactive', 'pending', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const connection = await this.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if tournament exists and get current status
    const [tournamentRows] = await connection.execute(
      'SELECT id, status FROM tournaments WHERE id = ?',
      [tournamentId]
    );
    
    if (tournamentRows.length === 0) {
      throw new Error('Tournament not found');
    }

    const currentStatus = tournamentRows[0].status;
    
    // Skip update if status is already the same
    if (currentStatus === status) {
      await connection.commit();
      return await this.findById(tournamentId);
    }

    // If activating this tournament, first deactivate all other tournaments
    if (status === 'active') {
      // Set other active tournaments to inactive
      const [updateResult] = await connection.execute(
        'UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id != ? AND status = ?',
        ['inactive', tournamentId, 'active']
      );
    }

    // Update the current tournament status
    const [result] = await connection.execute(
      'UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, tournamentId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Failed to update tournament status');
    }

    await connection.commit();
    
    // Return updated tournament
    const tournament = await this.findById(tournamentId);
    return tournament;
    
  } catch (error) {
    await connection.rollback();
    
    // Log the original error for debugging
    console.error('Tournament status update error:', error);
    
    // Throw a more specific error message
    if (error.message.includes('Tournament not found')) {
      throw error; // Re-throw as-is
    } else if (error.message.includes('Invalid status')) {
      throw error; // Re-throw validation errors as-is
    } else {
      throw new Error(`Error updating tournament status: ${error.message}`);
    }
  } finally {
    connection.release();
  }
}

async findAll(options = {}) {
  try {
    let query = `
      SELECT 
        t.*,
        GROUP_CONCAT(DISTINCT tm.name) as team_names,
        GROUP_CONCAT(DISTINCT p.name) as player_names,
        GROUP_CONCAT(DISTINCT tsg.game_id) as selected_game_ids,
        COUNT(DISTINCT tm.id) as team_count,
        COUNT(DISTINCT p.id) as player_count
      FROM tournaments t
      LEFT JOIN teams tm ON t.id = tm.tournament_id
      LEFT JOIN players p ON t.id = p.tournament_id
      LEFT JOIN tournament_selected_games tsg ON t.id = tsg.tournament_id
    `;
    
    const params = [];
    const conditions = [];

    // Apply status filter if provided
    if (options.status) {
      conditions.push('t.status = ?');
      params.push(options.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY t.id ORDER BY t.created_at DESC';

    // Apply pagination if provided
    if (options.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(options.limit));
      
      if (options.page) {
        const offset = (parseInt(options.page) - 1) * parseInt(options.limit);
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const [rows] = await this.execute(query, params);
    
    // Transform results to match expected format
    const tournaments = rows.map(row => ({
      ...row,
      selectedGames: row.selected_game_ids ? 
        row.selected_game_ids.split(',').map(id => id.trim()).filter(id => id) : 
        [],
      teams: row.team_names ? 
        row.team_names.split(',').map(name => ({ name: name.trim() })) : 
        [],
      players: row.player_names ? 
        row.player_names.split(',').map(name => ({ name: name.trim() })) : 
        []
    }));

    return tournaments;
    
  } catch (error) {
    throw new Error(`Error finding tournaments: ${error.message}`);
  }
}

async findById(tournamentId) {
  let connection;
  
  try {
    connection = await this.getConnection();
    
    // Get tournament basic info
    const [tournamentRows] = await connection.execute(`
      SELECT id, name, description, status, created_at, updated_at
      FROM tournaments 
      WHERE id = ?
    `, [tournamentId]);
    
    if (tournamentRows.length === 0) {
      return null;
    }
    
    const tournament = tournamentRows[0];
    
    // Get selected games from tournament_selected_games table
    const [selectedGamesRows] = await connection.execute(`
      SELECT tsg.id, tsg.game_id, g.name as game_name, g.description as game_description
      FROM tournament_selected_games tsg
      INNER JOIN games g ON tsg.game_id = g.id
      WHERE tsg.tournament_id = ?
      ORDER BY g.name
    `, [tournamentId]);

    // Get team scores by game
    const [teamScoresByGameRows] = await connection.execute(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        g.id as game_id,
        g.name as game_name,
        ts.id as score_id,
        ts.score_change,
        ts.reason,
        COALESCE(SUM(ts.score_change), 0) as game_total_score,
        COALESCE(SUM(CASE WHEN ts.score_change > 0 THEN ts.score_change ELSE 0 END), 0) as game_positive_score,
        COALESCE(SUM(CASE WHEN ts.score_change < 0 THEN ts.score_change ELSE 0 END), 0) as game_deductions,
        COUNT(ts.id) as score_entries_count
      FROM teams t
      LEFT JOIN team_scores ts ON t.id = ts.team_id
      LEFT JOIN games g ON ts.game_id = g.id
      WHERE t.tournament_id = ?
      GROUP BY t.id, t.name, g.id, g.name, ts.id, ts.score_change, ts.reason, ts.created_at
      ORDER BY t.name, g.name, ts.created_at DESC
    `, [tournamentId]);

    // Get player scores by game
    const [playerScoresByGameRows] = await connection.execute(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        p.id as player_id,
        p.name as player_name,
        a.id as animal_id,
        a.name as animal_name,
        g.id as game_id,
        g.name as game_name,
        ps.id as score_id,
        ps.score_change,
        ps.reason,
        ps.created_at as score_date,
        COALESCE(SUM(ps.score_change), 0) as game_total_score,
        COALESCE(SUM(CASE WHEN ps.score_change > 0 THEN ps.score_change ELSE 0 END), 0) as game_positive_score,
        COALESCE(SUM(CASE WHEN ps.score_change < 0 THEN ps.score_change ELSE 0 END), 0) as game_deductions,
        COUNT(ps.id) as score_entries_count
      FROM teams t
      JOIN players p ON t.id = p.team_id
      LEFT JOIN animals a ON p.animal_id = a.id
      LEFT JOIN player_scores ps ON p.id = ps.player_id
      LEFT JOIN games g ON ps.game_id = g.id
      WHERE t.tournament_id = ?
      GROUP BY t.id, t.name, p.id, p.name, a.id, a.name, g.id, g.name, ps.id, ps.score_change, ps.reason, ps.created_at
      ORDER BY t.name, p.name, g.name, ps.created_at DESC
    `, [tournamentId]);

    // Get aggregated team scores by game (without individual score entries)
    const [teamGameAggregatesRows] = await connection.execute(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        g.id as game_id,
        g.name as game_name,
        COALESCE(SUM(ts.score_change), 0) as total_score,
        COALESCE(SUM(CASE WHEN ts.score_change > 0 THEN ts.score_change ELSE 0 END), 0) as positive_score,
        COALESCE(SUM(CASE WHEN ts.score_change < 0 THEN ts.score_change ELSE 0 END), 0) as deductions,
        COUNT(ts.id) as total_entries,
        MIN(ts.created_at) as first_score_date,
        MAX(ts.created_at) as last_score_date
      FROM teams t
      LEFT JOIN team_scores ts ON t.id = ts.team_id
      LEFT JOIN games g ON ts.game_id = g.id
      WHERE t.tournament_id = ?
      GROUP BY t.id, t.name, g.id, g.name
      HAVING COUNT(ts.id) > 0
      ORDER BY t.name, g.name
    `, [tournamentId]);

    // Get aggregated player scores by game
    const [playerGameAggregatesRows] = await connection.execute(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        p.id as player_id,
        p.name as player_name,
        a.id as animal_id,
        a.name as animal_name,
        g.id as game_id,
        g.name as game_name,
        COALESCE(SUM(ps.score_change), 0) as total_score,
        COALESCE(SUM(CASE WHEN ps.score_change > 0 THEN ps.score_change ELSE 0 END), 0) as positive_score,
        COALESCE(SUM(CASE WHEN ps.score_change < 0 THEN ps.score_change ELSE 0 END), 0) as deductions,
        COUNT(ps.id) as total_entries,
        MIN(ps.created_at) as first_score_date,
        MAX(ps.created_at) as last_score_date
      FROM teams t
      JOIN players p ON t.id = p.team_id
      LEFT JOIN animals a ON p.animal_id = a.id
      LEFT JOIN player_scores ps ON p.id = ps.player_id
      LEFT JOIN games g ON ps.game_id = g.id
      WHERE t.tournament_id = ?
      GROUP BY t.id, t.name, p.id, p.name, a.id, a.name, g.id, g.name
      HAVING COUNT(ps.id) > 0
      ORDER BY t.name, p.name, g.name
    `, [tournamentId]);

    // Process teams and their game scores
    const teamsMap = new Map();
    const gamesByIdMap = new Map();
    
    // Initialize games map
    selectedGamesRows.forEach(game => {
      gamesByIdMap.set(game.game_id, {
        id: game.game_id,
        name: game.game_name,
        description: game.game_description
      });
    });

    // Process team game aggregates
    teamGameAggregatesRows.forEach(row => {
      if (!teamsMap.has(row.team_id)) {
        teamsMap.set(row.team_id, {
          id: row.team_id,
          name: row.team_name,
          gameScores: new Map(),
          players: new Map(),
          totalScore: 0,
          totalPositiveScore: 0,
          totalDeductions: 0
        });
      }
      
      const team = teamsMap.get(row.team_id);
      team.gameScores.set(row.game_id, {
        gameId: row.game_id,
        gameName: row.game_name,
        totalScore: Number(row.total_score),
        positiveScore: Number(row.positive_score),
        deductions: Math.abs(Number(row.deductions)),
        totalEntries: row.total_entries,
        firstScoreDate: row.first_score_date,
        lastScoreDate: row.last_score_date,
        scoreEntries: []
      });
      
      team.totalScore += Number(row.total_score);
      team.totalPositiveScore += Number(row.positive_score);
      team.totalDeductions += Math.abs(Number(row.deductions));
    });

    // Add detailed team score entries
    teamScoresByGameRows.forEach(row => {
      if (row.game_id && teamsMap.has(row.team_id)) {
        const team = teamsMap.get(row.team_id);
        if (team.gameScores.has(row.game_id)) {
          team.gameScores.get(row.game_id).scoreEntries.push({
            id: row.score_id,
            scoreChange: row.score_change,
            reason: row.reason || 'No reason provided',
            scoreDate: row.score_date
          });
        }
      }
    });

    // Process player game aggregates
    playerGameAggregatesRows.forEach(row => {
      if (!teamsMap.has(row.team_id)) {
        teamsMap.set(row.team_id, {
          id: row.team_id,
          name: row.team_name,
          gameScores: new Map(),
          players: new Map(),
          totalScore: 0,
          totalPositiveScore: 0,
          totalDeductions: 0
        });
      }
      
      const team = teamsMap.get(row.team_id);
      
      if (!team.players.has(row.player_id)) {
        team.players.set(row.player_id, {
          id: row.player_id,
          name: row.player_name,
          animal: {
            id: row.animal_id,
            name: row.animal_name
          },
          gameScores: new Map(),
          totalScore: 0,
          totalPositiveScore: 0,
          totalDeductions: 0
        });
      }
      
      const player = team.players.get(row.player_id);
      player.gameScores.set(row.game_id, {
        gameId: row.game_id,
        gameName: row.game_name,
        totalScore: Number(row.total_score),
        positiveScore: Number(row.positive_score),
        deductions: Math.abs(Number(row.deductions)),
        totalEntries: row.total_entries,
        firstScoreDate: row.first_score_date,
        lastScoreDate: row.last_score_date,
        scoreEntries: []
      });
      
      player.totalScore += Number(row.total_score);
      player.totalPositiveScore += Number(row.positive_score);
      player.totalDeductions += Math.abs(Number(row.deductions));
    });

    // Add detailed player score entries
    playerScoresByGameRows.forEach(row => {
      if (row.game_id && teamsMap.has(row.team_id)) {
        const team = teamsMap.get(row.team_id);
        if (team.players.has(row.player_id)) {
          const player = team.players.get(row.player_id);
          if (player.gameScores.has(row.game_id)) {
            player.gameScores.get(row.game_id).scoreEntries.push({
              id: row.score_id,
              scoreChange: row.score_change,
              reason: row.reason || 'No reason provided',
              scoreDate: row.score_date
            });
          }
        }
      }
    });

    // Convert maps to arrays and calculate totals
    const teams = Array.from(teamsMap.values()).map(team => {
      // Convert game scores map to array
      const gameScores = Array.from(team.gameScores.values());
      
      // Convert players map to array
      const players = Array.from(team.players.values()).map(player => ({
        ...player,
        gameScores: Array.from(player.gameScores.values())
      }));

      // Calculate team totals (including player scores)
      const playersTotalScore = players.reduce((sum, player) => sum + player.totalScore, 0);
      const playersPositiveScore = players.reduce((sum, player) => sum + player.totalPositiveScore, 0);
      const playersDeductions = players.reduce((sum, player) => sum + player.totalDeductions, 0);

      const finalTotalScore = team.totalScore + playersTotalScore;
      const finalPositiveScore = team.totalPositiveScore + playersPositiveScore;
      const finalDeductions = team.totalDeductions + playersDeductions;

      return {
        id: team.id,
        name: team.name,
        gameScores: gameScores,
        players: players,
        teamOnlyScore: team.totalScore,
        playersScore: playersTotalScore,
        totalScore: finalTotalScore,
        positiveScore: finalPositiveScore,
        totalDeductions: finalDeductions,
        scoreWithoutDeductions: finalPositiveScore,
        deductionImpact: finalDeductions
      };
    });

    // Sort teams by total score (descending)
    teams.sort((a, b) => b.totalScore - a.totalScore);

    // Add rankings
    teams.forEach((team, index) => {
      team.rank = index + 1;
      
      // Sort players within team by total score
      team.players.sort((a, b) => b.totalScore - a.totalScore);
      team.players.forEach((player, playerIndex) => {
        player.teamRank = playerIndex + 1;
      });
    });

    // Get all players for overall rankings
    const allPlayers = [];
    teams.forEach(team => {
      team.players.forEach(player => {
        allPlayers.push({
          ...player,
          teamName: team.name,
          teamId: team.id
        });
      });
    });

    // Sort all players by total score for overall rankings
    allPlayers.sort((a, b) => b.totalScore - a.totalScore);
    allPlayers.forEach((player, index) => {
      // Find the player in their team and add overall rank
      const team = teams.find(t => t.id === player.teamId);
      const teamPlayer = team.players.find(p => p.id === player.id);
      if (teamPlayer) {
        teamPlayer.overallRank = index + 1;
      }
    });

    // Format selected games
    const selectedGames = selectedGamesRows.map(row => ({
      id: row.id,
      game_id: row.game_id,
      name: row.game_name,
      description: row.game_description
    }));

    // Calculate game-specific statistics
    const gameStats = Array.from(gamesByIdMap.values()).map(game => {
      const gameId = game.id;
      
      // Team stats for this game
      const teamGameScores = teams
        .map(team => team.gameScores.find(gs => gs.gameId === gameId))
        .filter(Boolean);
      
      // Player stats for this game
      const playerGameScores = [];
      teams.forEach(team => {
        team.players.forEach(player => {
          const playerGameScore = player.gameScores.find(gs => gs.gameId === gameId);
          if (playerGameScore) {
            playerGameScores.push({
              ...playerGameScore,
              playerName: player.name,
              teamName: team.name,
              playerId: player.id,
              teamId: team.id
            });
          }
        });
      });

      return {
        ...game,
        teamParticipants: teamGameScores.length,
        playerParticipants: playerGameScores.length,
        totalTeamScore: teamGameScores.reduce((sum, gs) => sum + gs.totalScore, 0),
        totalPlayerScore: playerGameScores.reduce((sum, gs) => sum + gs.totalScore, 0),
        totalGameScore: teamGameScores.reduce((sum, gs) => sum + gs.totalScore, 0) + 
                        playerGameScores.reduce((sum, gs) => sum + gs.totalScore, 0),
        averageTeamScore: teamGameScores.length > 0 ? 
          (teamGameScores.reduce((sum, gs) => sum + gs.totalScore, 0) / teamGameScores.length).toFixed(2) : 0,
        averagePlayerScore: playerGameScores.length > 0 ? 
          (playerGameScores.reduce((sum, gs) => sum + gs.totalScore, 0) / playerGameScores.length).toFixed(2) : 0,
        highestTeamScore: teamGameScores.length > 0 ? Math.max(...teamGameScores.map(gs => gs.totalScore)) : 0,
        highestPlayerScore: playerGameScores.length > 0 ? Math.max(...playerGameScores.map(gs => gs.totalScore)) : 0,
        teamScores: teamGameScores,
        playerScores: playerGameScores
      };
    });

    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      createdAt: tournament.created_at,
      updatedAt: tournament.updated_at,
      teams: teams,
      selectedGames: selectedGames,
      gameStats: gameStats,
      summary: {
        totalTeams: teams.length,
        totalPlayers: allPlayers.length,
        totalGames: selectedGames.length,
        gamesWithTeamParticipation: gameStats.filter(g => g.teamParticipants > 0).length,
        gamesWithPlayerParticipation: gameStats.filter(g => g.playerParticipants > 0).length,
        totalScore: teams.reduce((sum, team) => sum + team.totalScore, 0),
        totalDeductions: teams.reduce((sum, team) => sum + team.totalDeductions, 0),
        averageScorePerTeam: teams.length > 0 ? 
          (teams.reduce((sum, team) => sum + team.totalScore, 0) / teams.length).toFixed(2) : 0,
        averageScorePerPlayer: allPlayers.length > 0 ? 
          (allPlayers.reduce((sum, player) => sum + player.totalScore, 0) / allPlayers.length).toFixed(2) : 0
      }
    };
    
  } catch (error) {
    throw new Error(`Error finding tournament: ${error.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

  async update(id, updateData) {
    try {
      // Build dynamic update query
      const updates = [];
      const params = [];
      
      Object.keys(updateData).forEach(key => {
        if (key === 'selectedGames') {
          updates.push(`${key} = ?`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          updates.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      });
      
      updates.push('updated_at = NOW()');
      params.push(id);

      const query = `UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`;
      
      const [result] = await this.execute(query, params);
      
      if (result.affectedRows === 0) {
        throw new Error('Tournament not found');
      }

      return await this.findById(id);
      
    } catch (error) {
      throw new Error(`Error updating tournament: ${error.message}`);
    }
  }

  async delete(id) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete related records first (foreign key constraints)
      await connection.execute('DELETE FROM players WHERE tournament_id = ?', [id]);
      await connection.execute('DELETE FROM teams WHERE tournament_id = ?', [id]);
      await connection.execute('DELETE FROM tournament_leaderboards WHERE tournament_id = ?', [id]);
      
      // Delete tournament
      const [result] = await connection.execute('DELETE FROM tournaments WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Tournament not found');
      }

      await connection.commit();
      return { id, deleted: true };
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error deleting tournament: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async getTournamentStats(tournamentId) {
    try {
      // Get tournament basic info
      const [tournamentRows] = await this.execute(`
        SELECT 
          t.*,
          COUNT(DISTINCT tm.id) as total_teams,
          COUNT(DISTINCT p.id) as total_players
        FROM tournaments t
        LEFT JOIN teams tm ON t.id = tm.tournament_id
        LEFT JOIN players p ON t.id = p.tournament_id
        WHERE t.id = ?
        GROUP BY t.id
      `, [tournamentId]);

      if (tournamentRows.length === 0) {
        throw new Error('Tournament not found');
      }

      const tournament = tournamentRows[0];
      
      // Get leaderboard info
      const [leaderboardRows] = await this.execute(
        'SELECT * FROM tournament_leaderboards WHERE tournament_id = ?',
        [tournamentId]
      );

      const leaderboard = leaderboardRows[0] || {};
      const gameLeaderboards = JSON.parse(leaderboard.gameLeaderboards || '[]');
      const overallTeamRankings = JSON.parse(leaderboard.overallTeamRankings || '[]');
      const overallPlayerRankings = JSON.parse(leaderboard.overallPlayerRankings || '[]');

      const stats = {
        tournamentInfo: {
          name: tournament.name,
          status: tournament.status,
          currentRound: tournament.currentRoundNumber,
          totalTeams: parseInt(tournament.total_teams) || 0,
          totalPlayers: parseInt(tournament.total_players) || 0,
          totalGames: JSON.parse(tournament.selectedGames || '[]').length
        },
        gameProgress: {
          completedGames: gameLeaderboards.filter(gl => gl.status === 'completed').length,
          inProgressGames: gameLeaderboards.filter(gl => gl.status === 'in_progress').length,
          pendingGames: gameLeaderboards.filter(gl => gl.status === 'pending').length
        },
        leaderboardSummary: {
          topTeam: overallTeamRankings[0] || null,
          topPlayer: overallPlayerRankings[0] || null,
          winner: leaderboard.winner,
          lastUpdated: leaderboard.lastUpdated
        }
      };

      return stats;
      
    } catch (error) {
      throw new Error(`Error getting tournament stats: ${error.message}`);
    }
  }

  async addPlayerToTeam(tournamentId, teamId, playerData) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if tournament and team exist
      const [tournamentRows] = await connection.execute(
        'SELECT * FROM tournaments WHERE id = ?',
        [tournamentId]
      );
      
      if (tournamentRows.length === 0) {
        throw new Error('Tournament not found');
      }

      const [teamRows] = await connection.execute(
        'SELECT * FROM teams WHERE id = ? AND tournament_id = ?',
        [teamId, tournamentId]
      );
      
      if (teamRows.length === 0) {
        throw new Error('Team not found or does not belong to this tournament');
      }

      // Find animal
      const animalName = this.mapEmojiToAnimalName(playerData.avatar || playerData.animalAvatar);
      const [animalRows] = await connection.execute(
        'SELECT id FROM animals WHERE name = ?',
        [animalName]
      );
      
      if (animalRows.length === 0) {
        throw new Error(`Animal not found for: ${animalName}`);
      }

      // Create new player
      const playerQuery = `
        INSERT INTO players (name, animal_id, team_id, tournament_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.execute(playerQuery, [
        playerData.name,
        animalRows[0].id,
        teamId,
        tournamentId
      ]);

      await connection.commit();
      return  { message: 'Player added successfully' };
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error adding player to team: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async updatePlayer(playerId, playerData) {
  const connection = await this.getConnection();

  try {
    await connection.beginTransaction();

    // Optional: Check if player exists
    const [playerRows] = await connection.execute(
      'SELECT * FROM players WHERE id = ?',
      [playerId]
    );

    if (playerRows.length === 0) {
      throw new Error('Player not found');
    }

    // Resolve the new animal avatar name
    const animalName = this.mapEmojiToAnimalName(playerData.avatar);
    const [animalRows] = await connection.execute(
      'SELECT id FROM animals WHERE name = ?',
      [animalName]
    );

    if (animalRows.length === 0) {
      throw new Error(`Animal not found for: ${animalName}`);
    }

    // Update the player's name and avatar
    const updateQuery = `
      UPDATE players 
      SET name = ?, animal_id = ?, updated_at = NOW() 
      WHERE id = ?
    `;

    await connection.execute(updateQuery, [
      playerData.name,
      animalRows[0].id,
      playerId
    ]);

    await connection.commit();
    return { message: 'Player updated successfully' };

  } catch (error) {
    await connection.rollback();
    throw new Error(`Error updating player: ${error.message}`);
  } finally {
    connection.release();
  }
}


  async removePlayerFromTeam(tournamentId, teamId, playerId) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verify relationships
      const [playerRows] = await connection.execute(
        'SELECT * FROM players WHERE id = ? AND team_id = ? AND tournament_id = ?',
        [playerId, teamId, tournamentId]
      );
      
      if (playerRows.length === 0) {
        throw new Error('Player not found or does not belong to this team/tournament');
      }

      // Delete the player
      await connection.execute('DELETE FROM players WHERE id = ?', [playerId]);

      await connection.commit();
      return await this.getTeamWithPlayers(teamId);
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error removing player from team: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async removeTeamFromTournament(tournamentId, teamId) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if tournament allows removing teams
      const [tournamentRows] = await connection.execute(
        'SELECT status FROM tournaments WHERE id = ?',
        [tournamentId]
      );
      
      if (tournamentRows.length === 0) {
        throw new Error('Tournament not found');
      }

      if (tournamentRows[0].status === 'completed') {
        throw new Error('Cannot remove teams from a completed tournament');
      }

      // Verify team belongs to tournament
      const [teamRows] = await connection.execute(
        'SELECT id FROM teams WHERE id = ? AND tournament_id = ?',
        [teamId, tournamentId]
      );
      
      if (teamRows.length === 0) {
        throw new Error('Team not found or does not belong to this tournament');
      }

      // Delete players first (foreign key constraint)
      await connection.execute('DELETE FROM players WHERE team_id = ?', [teamId]);
      
      // Delete team
      await connection.execute('DELETE FROM teams WHERE id = ?', [teamId]);

      await connection.commit();
      return await this.findById(tournamentId);
      
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error removing team from tournament: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  async getTeamWithPlayers(teamId) {
    
  }

async getLeaderboardForTournament(tournamentId = null) {

  let connection;
  
  try {
    connection = await this.getConnection();
    
    // If no tournamentId provided, get the active tournament
    if (!tournamentId) {
      const [activeTournamentRows] = await connection.execute(`
        SELECT id FROM tournaments WHERE status = 'active' LIMIT 1
      `);
      
    if (!activeTournamentRows || activeTournamentRows === null || activeTournamentRows.length === 0) {
  return null; // Don't throw, just return null
}
      
      tournamentId = activeTournamentRows[0]?.id;
    }

    // Get tournament details
    const [tournamentRows] = await connection.execute(`
      SELECT id, name, description, status 
      FROM tournaments 
      WHERE id = ?
    `, [tournamentId]);

    if (tournamentRows.length === 0) {
      throw new Error('Tournament not found');
    }

    const tournament = tournamentRows[0];
    
    // Get selected games for the tournament
    const [gamesRows] = await connection.execute(`
      SELECT 
        g.id,
        g.name,
        g.type,
        g.description,
        g.rules,
        g.win_points,
        g.bonus_points,
        g.penalty_points,
        g.point_system_custom_rules,
        g.prizes,
        g.time_limit,
        g.max_players,
        g.min_players,
        g.equipment,
        g.applicable_superpowers
      FROM games g
      INNER JOIN tournament_selected_games tsg ON g.id = tsg.game_id
      WHERE tsg.tournament_id = ?
      ORDER BY g.name;
    `, [tournamentId]);

    // Get team scores breakdown by game
    const [teamGameScoresRows] = await connection.execute(`
      SELECT 
        ts.team_id,
        ts.game_id,
        g.name as game_name,
        SUM(ts.score_change) as total_score,
        COUNT(ts.id) as score_entries,
        ts.reason
      FROM team_scores ts
      INNER JOIN games g ON ts.game_id = g.id
      WHERE ts.tournament_id = ?
      GROUP BY ts.team_id, ts.game_id, ts.reason
      ORDER BY ts.team_id, g.name;
    `, [tournamentId]);

    // Get player scores breakdown by game
    const [playerGameScoresRows] = await connection.execute(`
      SELECT 
        ps.player_id,
        p.team_id,
        ps.game_id,
        g.name as game_name,
        SUM(ps.score_change) as total_score,
        COUNT(ps.id) as score_entries,
        ps.reason
      FROM player_scores ps
      INNER JOIN players p ON ps.player_id = p.id
      INNER JOIN games g ON ps.game_id = g.id
      WHERE ps.tournament_id = ?
      GROUP BY ps.player_id, ps.game_id, ps.reason
      ORDER BY p.team_id, ps.player_id, g.name;
    `, [tournamentId]);

    // Get leaderboard data with team and player scores
    const [leaderboardRows] = await connection.execute(`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        COALESCE(te.total, 0) + COALESCE(pe.total, 0) as team_score,
        p.id as player_id,
        p.name as player_name,
        COALESCE(ps.score, 0) as player_score,
        a.name as animal_name
      FROM teams t
      LEFT JOIN (
        SELECT team_id, SUM(score_change) as total 
        FROM team_scores 
        WHERE tournament_id = ?
        GROUP BY team_id
      ) te ON te.team_id = t.id
      LEFT JOIN (
        SELECT p.team_id, SUM(pe.score_change) as total
        FROM players p
        LEFT JOIN player_scores pe ON pe.player_id = p.id
        WHERE p.tournament_id = ? AND (pe.tournament_id = ? OR pe.tournament_id IS NULL)
        GROUP BY p.team_id  
      ) pe ON pe.team_id = t.id
      LEFT JOIN players p ON p.team_id = t.id
      LEFT JOIN (
        SELECT player_id, SUM(score_change) as score
        FROM player_scores
        WHERE tournament_id = ?
        GROUP BY player_id
      ) ps ON ps.player_id = p.id
      LEFT JOIN animals a ON p.animal_id = a.id
      WHERE t.tournament_id = ?
      ORDER BY team_score DESC, player_score DESC;
    `, [tournamentId, tournamentId, tournamentId, tournamentId, tournamentId]);
    
    // Process team game scores into a map
    const teamGameScoresMap = new Map();
    teamGameScoresRows.forEach(row => {
      if (!teamGameScoresMap.has(row.team_id)) {
        teamGameScoresMap.set(row.team_id, new Map());
      }
      if (!teamGameScoresMap.get(row.team_id).has(row.game_id)) {
        teamGameScoresMap.get(row.team_id).set(row.game_id, {
          gameId: row.game_id,
          gameName: row.game_name,
          totalScore: 0,
          scoreBreakdown: []
        });
      }
      
      const gameScore = teamGameScoresMap.get(row.team_id).get(row.game_id);
      // FIXED: Convert to number
      const scoreValue = parseInt(row.total_score || 0);
      gameScore.totalScore += scoreValue;
      gameScore.scoreBreakdown.push({
        score: scoreValue, // Now a number
        reason: row.reason,
        entries: row.score_entries,
        timestamp: row.created_at
      });
    });

    // Process player game scores into a map
    const playerGameScoresMap = new Map();
    playerGameScoresRows.forEach(row => {
      if (!playerGameScoresMap.has(row.player_id)) {
        playerGameScoresMap.set(row.player_id, new Map());
      }
      if (!playerGameScoresMap.get(row.player_id).has(row.game_id)) {
        playerGameScoresMap.get(row.player_id).set(row.game_id, {
          gameId: row.game_id,
          gameName: row.game_name,
          totalScore: 0,
          scoreBreakdown: []
        });
      }
      
      const gameScore = playerGameScoresMap.get(row.player_id).get(row.game_id);
      // FIXED: Convert to number
      const scoreValue = parseInt(row.total_score || 0);
      gameScore.totalScore += scoreValue;
      gameScore.scoreBreakdown.push({
        score: scoreValue, // Now a number
        reason: row.reason,
        entries: row.score_entries,
        timestamp: row.created_at
      });
    });
    
    // Process the results to group by teams
    const teamsMap = new Map();
    
    leaderboardRows.forEach(row => {
      if (!teamsMap.has(row.team_id)) {
        teamsMap.set(row.team_id, {
          id: row.team_id,
          name: row.team_name,
          totalScore: parseInt(row.team_score || 0), // FIXED: Convert to number
          players: [],
          gameScores: []
        });
      }
      
      // Add player if exists (LEFT JOIN might have teams without players)
      if (row.player_id) {
        // Get player's game score breakdown
        const playerGameScores = playerGameScoresMap.get(row.player_id) || new Map();
        const gameScoresArray = Array.from(playerGameScores.values());
        
        teamsMap.get(row.team_id).players.push({
          id: row.player_id,
          name: row.player_name,
          score: parseInt(row.player_score || 0), // FIXED: Convert to number
          animal: {
            name: row.animal_name,
            emoji: row.animal_emoji
          },
          gameScores: gameScoresArray
        });
      }
    });

    // Add team game scores to each team
    teamsMap.forEach((team, teamId) => {
      const teamGameScores = teamGameScoresMap.get(teamId) || new Map();
      team.gameScores = Array.from(teamGameScores.values());
    });
    
    // Convert to array and ensure teams are sorted by score
    const teams = Array.from(teamsMap.values())
      .sort((a, b) => b.totalScore - a.totalScore);
    
    // Sort players within each team by score and add team ranking
    teams.forEach((team, teamIndex) => {
      team.players.sort((a, b) => b.score - a.score);
      
      // FIXED: Calculate total individual player scores for this team (now all numbers)
      const totalPlayerScores = team.players.reduce((sum, player) => sum + player.score, 0);
      
      // FIXED: Calculate team bonus (team score minus individual player scores)
      team.teamBonus = team.totalScore - totalPlayerScores;
      
      // Add team ranking to each player and their rank within the team
      team.players.forEach((player, playerIndex) => {
        player.teamRank = playerIndex + 1; // Rank within team (1st, 2nd, 3rd, etc.)
        player.teamName = team.name;
        player.teamId = team.id;
        player.teamOverallRank = teamIndex + 1; // Team's overall ranking
      });
    });

    // Create game-wise summary
    const gameWiseSummary = gamesRows.map(game => {
      const gameTeamScores = [];
      const gamePlayerScores = [];
      
      teams.forEach(team => {
        // Find team scores for this game
        const teamGameScore = team.gameScores.find(gs => gs.gameId === game.id);
        if (teamGameScore) {
          gameTeamScores.push({
            teamId: team.id,
            teamName: team.name,
            score: teamGameScore.totalScore, // Already a number
            breakdown: teamGameScore.scoreBreakdown
          });
        }
        
        // Find player scores for this game
        team.players.forEach(player => {
          const playerGameScore = player.gameScores.find(gs => gs.gameId === game.id);
          if (playerGameScore) {
            gamePlayerScores.push({
              playerId: player.id,
              playerName: player.name,
              teamId: team.id,
              teamName: team.name,
              score: playerGameScore.totalScore, // Already a number
              breakdown: playerGameScore.scoreBreakdown
            });
          }
        });
      });

      // Sort by score (highest first)
      gameTeamScores.sort((a, b) => b.score - a.score);
      gamePlayerScores.sort((a, b) => b.score - a.score);

      return {
        gameId: game.id,
        gameName: game.name,
        teamScores: gameTeamScores,
        playerScores: gamePlayerScores,
        totalTeamParticipants: gameTeamScores.length,
        totalPlayerParticipants: gamePlayerScores.length
      };
    });
    
    // Calculate total players across all teams
    const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);
    
    // Find highest team score and name
    let highestTeam = null;
    if (teams.length > 0) {
      highestTeam = {
        name: teams[0].name,
        score: teams[0].totalScore, // Already a number
        id: teams[0].id
      };
    }
    
    // Find highest individual player score and name across all teams
    let highestPlayer = null;
    let highestPlayerScore = -Infinity;
    
    teams.forEach(team => {
      team.players.forEach(player => {
        if (player.score > highestPlayerScore) {
          highestPlayerScore = player.score;
          highestPlayer = {
            name: player.name,
            score: player.score, // Already a number
            id: player.id,
            teamName: team.name,
            teamId: team.id,
            animal: player.animal
          };
        }
      });
    });
    
    return {
      tournamentId: tournamentId,
      tournamentName: tournament.name,
      tournamentDescription: tournament.description,
      tournamentStatus: tournament.status,
      tournamentStartDate: tournament.start_date,
      tournamentEndDate: tournament.end_date,
      teamRankings: teams,
      totalTeams: teams.length,
      totalPlayers: totalPlayers,
      highestTeam: highestTeam,
      highestPlayer: highestPlayer,
      gameWiseBreakdown: gameWiseSummary,
      selectedGames: {
        count: gamesRows.length,
        games: gamesRows.map(game => ({
          id: game.id,
          name: game.name,
          type: game.type,
          description: game.description,
          rules: game.rules,
          scoring: {
            winPoints: game.win_points,
            bonusPoints: game.bonus_points,
            penaltyPoints: game.penalty_points,
            customRules: game.point_system_custom_rules
          },
          prizes: game.prizes,
          timeLimit: game.time_limit,
          playerLimits: {
            maxPlayers: game.max_players,
            minPlayers: game.min_players
          },
          equipment: game.equipment,
          applicableSuperpowers: game.applicable_superpowers
        }))
      },
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Error getting leaderboard for tournament: ${error.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async getTournamentGame(tournamentId, gameId) {
  const connection = await this.getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT * FROM tournament_selected_games WHERE tournament_id = ? AND game_id = ?',
      [tournamentId, gameId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Error retrieving specific tournament game: ${error.message}`);
  } finally {
    connection.release();
  }
}

}
export default TournamentRepository;