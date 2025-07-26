import mysql from 'mysql2/promise';
import dbConfig from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';


class LeaderboardScoringRepository {
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

// async recordGameScores(tournamentId, gameId, transformedScores, scoreType, io, requestId = null) {
//   const uniqueRequestId = requestId || uuidv4();

  
//   const maxRetries = 3;
//   let lastError;
  
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
   
    
//     // FIXED: Changed from this.db.getConnection() to this.getConnection()
//     const connection = await this.getConnection();

    
//     try {
    
//       await connection.beginTransaction();
      
      
//       // Input validation
//       if (!transformedScores || !Array.isArray(transformedScores)) {
//         throw new Error('Transformed scores must be a valid array');
//       }
      
//       if (transformedScores.length === 0) {
//         console.warn('⚠️ No scores to process');
//         await connection.commit();
//         return { success: true, message: 'No scores to process' };
//       }
      
//       if (!['team', 'player'].includes(scoreType)) {
//         throw new Error('Score type must be either "team" or "player"');
//       }
      
//       const [tournamentRows] = await connection.execute(
//         'SELECT id, version FROM tournaments WHERE id = ? FOR UPDATE',
//         [tournamentId]
//       );
      
//       if (tournamentRows.length === 0) {
//         throw new Error(`Tournament not found with ID: ${tournamentId}`);
//       }
      
//       const tournament = tournamentRows[0];
    
//       let existingRequests = [];
      
//       if (scoreType === 'team') {
//         const [teamRequests] = await connection.execute(
//           'SELECT id FROM team_scores WHERE tournament_id = ? AND game_id = ? AND reason LIKE ? LIMIT 1',
//           [tournamentId, gameId, `%RequestID:${uniqueRequestId}%`]
//         );
//         existingRequests = teamRequests;
//       } else {
//         const [playerRequests] = await connection.execute(
//           'SELECT id FROM player_scores WHERE tournament_id = ? AND game_id = ? AND reason LIKE ? LIMIT 1',
//           [tournamentId, gameId, `%RequestID:${uniqueRequestId}%`]
//         );
//         existingRequests = playerRequests;
//       }
      
//       if (existingRequests.length > 0) {
       
//         await connection.commit();
//         return { success: true, message: 'Request already processed' };
//       }
      

//       if (scoreType === 'team') {
//         await this.processTeamScores(connection, tournamentId, gameId, transformedScores, uniqueRequestId);
//       } else {
//         await this.processPlayerScores(connection, tournamentId, gameId, transformedScores, uniqueRequestId);
//       }
  
//       if (scoreType === 'team') {
//         const [verifyResult] = await connection.execute(
//           'SELECT COUNT(*) as count FROM team_scores WHERE tournament_id = ? AND game_id = ? AND reason LIKE ?',
//           [tournamentId, gameId, `%RequestID:${uniqueRequestId}%`]
//         );
   
//         if (verifyResult[0].count === 0) {
//           throw new Error('No team scores were inserted - check processTeamScores method');
//         }
//       }
      
//       const [updateResult] = await connection.execute(
//         'UPDATE tournaments SET version = version + 1, updated_at = NOW() WHERE id = ? AND version = ?',
//         [tournamentId, tournament.version]
//       );
      
//       if (updateResult.affectedRows === 0) {
//         throw new Error('Tournament was modified by another process. Please retry.');
//       }
      
//       await connection.commit();
      
//       if (scoreType === 'team') {
//         const [finalCheck] = await connection.execute(
//           'SELECT COUNT(*) as count FROM team_scores WHERE tournament_id = ? AND game_id = ?',
//           [tournamentId, gameId]
//         );
//       }
      
//       // Emit event after successful completion
//       process.nextTick(() => {
//         io.emit('leaderboardUpdated', { 
//           gameId, 
//           tournamentId, 
//           scoreType,
//           timestamp: new Date(),
//           requestId: uniqueRequestId 
//         });
//       });
      
//       return { success: true, requestId: uniqueRequestId };
      
//     } catch (error) {
//       console.error(`❌ ERROR in attempt ${attempt}:`, error.message);
//       console.error(`Rolling back transaction...`);
      
//       try {
//         await connection.rollback();
//       } catch (rollbackError) {
//         console.error(`❌ Rollback failed:`, rollbackError.message);
//       }
      
//       lastError = error;
      
//       if (attempt === maxRetries) {
//         throw new Error(`Error recording game scores after ${maxRetries} attempts: ${error.message}`);
//       }
      
//       // Exponential backoff with jitter to avoid thundering herd
//       const delay = 100 * Math.pow(2, attempt - 1) + Math.random() * 100;
  
//       await new Promise(resolve => setTimeout(resolve, delay));
      
//     } finally {
//       connection.release();
//     }
//   }
  
//   throw new Error(`Error recording game scores: ${lastError?.message || 'Unknown error'}`);
// }

async recordGameScores(tournamentId, gameId, transformedScores, scoreType, io, requestId = null) {
  const uniqueRequestId = requestId || uuidv4();

  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Input validation
      if (!transformedScores || !Array.isArray(transformedScores)) {
        throw new Error('Transformed scores must be a valid array');
      }
      
      if (transformedScores.length === 0) {
        console.warn('⚠️ No scores to process');
        await connection.commit();
        return { success: true, message: 'No scores to process' };
      }
      
      if (!['team', 'player'].includes(scoreType)) {
        throw new Error('Score type must be either "team" or "player"');
      }
      
      const [tournamentRows] = await connection.execute(
        'SELECT id, version FROM tournaments WHERE id = ? FOR UPDATE',
        [tournamentId]
      );
      
      if (tournamentRows.length === 0) {
        throw new Error(`Tournament not found with ID: ${tournamentId}`);
      }
      
      const tournament = tournamentRows[0];
    
      let existingRequests = [];
      
      if (scoreType === 'team') {
        const [teamRequests] = await connection.execute(
          'SELECT id FROM team_scores WHERE tournament_id = ? AND game_id = ? AND reason LIKE ? LIMIT 1',
          [tournamentId, gameId, `%RequestID:${uniqueRequestId}%`]
        );
        existingRequests = teamRequests;
      } else {
        const [playerRequests] = await connection.execute(
          'SELECT id FROM player_scores WHERE tournament_id = ? AND game_id = ? AND reason LIKE ? LIMIT 1',
          [tournamentId, gameId, `%RequestID:${uniqueRequestId}%`]
        );
        existingRequests = playerRequests;
      }
      
      if (existingRequests.length > 0) {
        await connection.commit();
        return { success: true, message: 'Request already processed' };
      }

      // Process scores
      if (scoreType === 'team') {
        await this.processTeamScores(connection, tournamentId, gameId, transformedScores, uniqueRequestId);
      } else {
        await this.processPlayerScores(connection, tournamentId, gameId, transformedScores, uniqueRequestId);
      }
  
      // Verify scores were inserted
      if (scoreType === 'team') {
        const [verifyResult] = await connection.execute(
          'SELECT COUNT(*) as count FROM team_scores WHERE tournament_id = ? AND game_id = ? AND reason LIKE ?',
          [tournamentId, gameId, `%RequestID:${uniqueRequestId}%`]
        );
   
        if (verifyResult[0].count === 0) {
          throw new Error('No team scores were inserted - check processTeamScores method');
        }
      }
      
      // Update tournament version
      const [updateResult] = await connection.execute(
        'UPDATE tournaments SET version = version + 1, updated_at = NOW() WHERE id = ? AND version = ?',
        [tournamentId, tournament.version]
      );
      
      if (updateResult.affectedRows === 0) {
        throw new Error('Tournament was modified by another process. Please retry.');
      }
      
      // Commit the transaction FIRST
      await connection.commit();
      console.log('✅ Transaction committed successfully');
      
      // Final verification check (optional, after commit)
      if (scoreType === 'team') {
        const [finalCheck] = await connection.execute(
          'SELECT COUNT(*) as count FROM team_scores WHERE tournament_id = ? AND game_id = ?',
          [tournamentId, gameId]
        );
        console.log(`📊 Final team scores count: ${finalCheck[0].count}`);
      }
      
      // FIXED: Emit event immediately after successful commit, not in nextTick
      console.log('🚀 Emitting leaderboardUpdated event...');
      
      try {
        io.emit('leaderboardUpdated', { 
          gameId, 
          tournamentId, 
          scoreType,
          timestamp: new Date(),
          requestId: uniqueRequestId 
        });
        console.log('✅ Event emitted successfully');
      } catch (emitError) {
        console.error('❌ Error emitting WebSocket event:', emitError.message);
        // Don't throw here - the database operation was successful
      }
      
      return { success: true, requestId: uniqueRequestId };
      
    } catch (error) {
      console.error(`❌ ERROR in attempt ${attempt}:`, error.message);
      console.error(`Rolling back transaction...`);
      
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(`❌ Rollback failed:`, rollbackError.message);
      }
      
      lastError = error;
      
      if (attempt === maxRetries) {
        throw new Error(`Error recording game scores after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff with jitter
      const delay = 100 * Math.pow(2, attempt - 1) + Math.random() * 100;
      console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } finally {
      connection.release();
    }
  }
  
  throw new Error(`Error recording game scores: ${lastError?.message || 'Unknown error'}`);
}

async processTeamScores(connection, tournamentId, gameId, scores, requestId) {

  
  for (let i = 0; i < scores.length; i++) {
    const scoreData = scores[i];
    
    const { team_id, score, reason } = scoreData;
    
    // Validate required fields
    if (!team_id) {
      console.error(`❌ Missing team_id in score ${i + 1}:`, scoreData);
      throw new Error(`team_id is required for team scores at index ${i}`);
    }
    
    if (score === undefined || score === null) {
      console.error(`❌ Missing score in score ${i + 1}:`, scoreData);
      throw new Error(`score is required and cannot be null/undefined at index ${i}`);
    }
    
    // Append request ID to reason for idempotency tracking
    const reasonWithRequestId = `${reason || ''} [RequestID:${requestId}]`.trim();

    
    try {
      
      // Insert into team_scores table
      const [result] = await connection.execute(
        `INSERT INTO team_scores (
          id, tournament_id, game_id, team_id, score_change, reason, created_at, updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
        [tournamentId, gameId, team_id, score, reasonWithRequestId]
      );
    
      // Immediately verify the insert
      const [verifyInsert] = await connection.execute(
        'SELECT id, team_id, score_change, reason FROM team_scores WHERE tournament_id = ? AND game_id = ? AND team_id = ? AND reason LIKE ? ORDER BY created_at DESC LIMIT 1',
        [tournamentId, gameId, team_id, `%RequestID:${requestId}%`]
      );
      
    } catch (insertError) {
      console.error(`❌ Failed to insert team score for team ${team_id}:`, insertError);
      throw insertError;
    }
  }

}

async processPlayerScores(connection, tournamentId, gameId, scores, requestId) {

  
  for (let i = 0; i < scores.length; i++) {
    const scoreData = scores[i];
  
    const { player_id, team_id, score, reason } = scoreData;
    
    // Validate required fields with detailed logging
    if (!player_id) {
      console.error(`❌ Missing player_id in score ${i + 1}:`, scoreData);
      console.error(`Available keys:`, Object.keys(scoreData));
      throw new Error(`player_id is required for player scores at index ${i}. Available keys: ${Object.keys(scoreData).join(', ')}`);
    }
    
    if (score === undefined || score === null) {
      console.error(`❌ Missing score in score ${i + 1}:`, scoreData);
      throw new Error(`score is required and cannot be null/undefined at index ${i}`);
    }
    
    // Append request ID to reason for idempotency tracking
    const reasonWithRequestId = `${reason || ''} [RequestID:${requestId}]`.trim();
 
    try {
   
      // Insert into player_scores table
      const [result] = await connection.execute(
        `INSERT INTO player_scores (
          id, tournament_id, game_id, player_id, team_id, score_change, reason, created_at, updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [tournamentId, gameId, player_id, team_id, score, reasonWithRequestId]
      );
      
      // Immediately verify the insert
      const [verifyInsert] = await connection.execute(
        'SELECT id, player_id, team_id, score_change, reason FROM player_scores WHERE tournament_id = ? AND game_id = ? AND player_id = ? AND reason LIKE ? ORDER BY created_at DESC LIMIT 1',
        [tournamentId, gameId, player_id, `%RequestID:${requestId}%`]
      );
      
    } catch (insertError) {
      console.error(`❌ Failed to insert player score for player ${player_id}:`, insertError);
      throw insertError;
    }
  }
}

  async updatePlayerScoreInTeam(connection, tournamentId, gameId, teamId, playerScore, requestId) {
    // This is handled by updateIndividualPlayerScore as we're using normalized tables
    await this.updateIndividualPlayerScore(connection, tournamentId, gameId, playerScore, requestId);
  }

  async updateIndividualPlayerScore(connection, tournamentId, gameId, playerScore, requestId) {
    const cleanedPlayerScore = this.validateAndCleanPlayerScore(playerScore);
    
    // Get or create player score record
    let [existingPlayerScores] = await connection.execute(
      `SELECT id, score FROM player_scores 
       WHERE tournament_id = ? AND game_id = ? AND player_id = ?`,
      [tournamentId, gameId, cleanedPlayerScore.playerId]
    );
    
    let playerScoreRecord;
    
    if (existingPlayerScores.length > 0) {
      // Update existing player score
      playerScoreRecord = existingPlayerScores[0];
      const previousScore = playerScoreRecord.score || 0;
      const newScore = previousScore + (cleanedPlayerScore.score || 0);
      
      await connection.execute(
        `UPDATE player_scores 
         SET score = ?, metadata = ?, updated_at = NOW()
         WHERE id = ?`,
        [newScore, JSON.stringify(cleanedPlayerScore.metadata), playerScoreRecord.id]
      );
      
      // Record player score history
      await connection.execute(
        `INSERT INTO player_score_history (
          player_score_id, tournament_id, game_id, player_id, request_id,
          previous_score, score_added, new_total_score, is_deduction, is_negative_total
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          playerScoreRecord.id, tournamentId, gameId, cleanedPlayerScore.playerId, requestId,
          previousScore, cleanedPlayerScore.score || 0, newScore,
          (cleanedPlayerScore.score || 0) < 0, newScore < 0
        ]
      );
      
    } else {
      // Create new player score record
      const [insertResult] = await connection.execute(
        `INSERT INTO player_scores (
          tournament_id, game_id, player_id, team_id, score, metadata
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tournamentId, gameId, cleanedPlayerScore.playerId,
          cleanedPlayerScore.teamId, cleanedPlayerScore.score || 0,
          JSON.stringify(cleanedPlayerScore.metadata)
        ]
      );
      
      const newPlayerScoreId = insertResult.insertId;
      
      // Record initial player score history
      await connection.execute(
        `INSERT INTO player_score_history (
          player_score_id, tournament_id, game_id, player_id, request_id,
          previous_score, score_added, new_total_score, is_deduction, is_negative_total
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newPlayerScoreId, tournamentId, gameId, cleanedPlayerScore.playerId, requestId,
          0, cleanedPlayerScore.score || 0, cleanedPlayerScore.score || 0,
          (cleanedPlayerScore.score || 0) < 0, (cleanedPlayerScore.score || 0) < 0
        ]
      );
      
      playerScoreRecord = { id: newPlayerScoreId };
    }
    
    // Record general score history
    await connection.execute(
      `INSERT INTO score_history (
        tournament_id, game_id, entity_type, entity_id, request_id, score_type,
        previous_score, score_added, new_total_score, is_deduction, is_negative_total,
        metadata
       ) VALUES (?, ?, 'player', ?, ?, 'individual', ?, ?, ?, ?, ?, ?)`,
      [
        tournamentId, gameId, cleanedPlayerScore.playerId, requestId,
        0, cleanedPlayerScore.score || 0, cleanedPlayerScore.score || 0,
        (cleanedPlayerScore.score || 0) < 0, (cleanedPlayerScore.score || 0) < 0,
        JSON.stringify(cleanedPlayerScore.metadata || {})
      ]
    );
  }

  async updateTeamScoreFromPlayerScore(connection, tournamentId, gameId, playerScore, requestId) {
    // Get or create team score record
    let [existingTeamScores] = await connection.execute(
      `SELECT id, individual_player_score, total_score 
       FROM team_scores 
       WHERE tournament_id = ? AND game_id = ? AND team_id = ?`,
      [tournamentId, gameId, playerScore.teamId]
    );
    
    if (existingTeamScores.length > 0) {
      const teamScoreRecord = existingTeamScores[0];
      
      // Update team's individual player score component
      const newIndividualPlayerScore = (teamScoreRecord.individual_player_score || 0) + (playerScore.score || 0);
      const newTotalScore = (teamScoreRecord.total_score || 0) + (playerScore.score || 0);
      
      await connection.execute(
        `UPDATE team_scores 
         SET individual_player_score = ?, total_score = ?, updated_at = NOW()
         WHERE id = ?`,
        [newIndividualPlayerScore, newTotalScore, teamScoreRecord.id]
      );
      
    } else {
      // Create new team score record with just player contribution
      await connection.execute(
        `INSERT INTO team_scores (
          tournament_id, game_id, team_id, team_bonus_score, 
          individual_player_score, total_score
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tournamentId, gameId, playerScore.teamId, 0,
          playerScore.score || 0, playerScore.score || 0
        ]
      );
    }
  }

  async calculateTeamTotalsWithPlayerScores(connection, tournamentId, gameId) {
    // Update team scores with calculated totals from player scores
    await connection.execute(`
      UPDATE team_scores ts
      SET 
        players_only_score = COALESCE((
          SELECT SUM(ps.score) 
          FROM player_scores ps 
          WHERE ps.tournament_id = ts.tournament_id 
            AND ps.game_id = ts.game_id 
            AND ps.team_id = ts.team_id
        ), 0),
        player_count = COALESCE((
          SELECT COUNT(*) 
          FROM player_scores ps 
          WHERE ps.tournament_id = ts.tournament_id 
            AND ps.game_id = ts.game_id 
            AND ps.team_id = ts.team_id
        ), 0)
      WHERE ts.tournament_id = ? AND ts.game_id = ?
    `, [tournamentId, gameId]);
    
    // Update total_score_with_players
    await connection.execute(`
      UPDATE team_scores ts
      SET 
        total_score_with_players = ts.total_score + ts.players_only_score,
        team_only_score = ts.team_bonus_score
      WHERE ts.tournament_id = ? AND ts.game_id = ?
    `, [tournamentId, gameId]);
  }

  validateAndCleanPlayerScore(playerScore, teamId = null) {
    if (!playerScore || !playerScore.playerId) {
      throw new Error('Invalid player score: playerId is required');
    }

    // Explicitly handle negative scores
    const scoreValue = typeof playerScore.score === 'number' ? playerScore.score : 0;
    
    // Optional: Add validation for extreme negative scores if needed
    if (scoreValue < -10000) {
      console.warn(`Very large negative score detected: ${scoreValue} for player ${playerScore.playerId}`);
    }

    return {
      playerId: playerScore.playerId,
      teamId: teamId || playerScore.teamId || null,
      score: scoreValue, // This can be negative
      metadata: playerScore.metadata || {}
    };
  }


}
export default LeaderboardScoringRepository;