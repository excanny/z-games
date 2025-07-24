//import AnimalRepository from '../../infrastructure/repositories/AnimalRepository.js';
//import GameRepository from '../../infrastructure/repositories/gameRepository.js';
import TournamentRepository from '../../infrastructure/repositories/TournamentRepository.js';
import LeaderboardScoringRepository from '../../infrastructure/repositories/LeaderboardScoringRepository.js';
//import LeaderboardRankingRepository from '../../infrastructure/repositories/LeaderboardRankingRepository.js';

class LeaderboardScoringController {
  constructor() {
    //this.animalRepository = new AnimalRepository();
    this.leaderboardScoringRepository = new LeaderboardScoringRepository();
    this.tournamentRepository = new TournamentRepository();

  }

  // ===== LEADERBOARD AND SCORING METHODS =====

  async recordGameScores(req, res) {
  try {
    const { tournamentId, gameId } = req.params;
    const { teamScores, playerScores, scoreType } = req.body;
    const io = req.app.get('io');

    // [All your existing validation code stays the same...]
    const errors = [];
    
    // Check required parameters
    if (!tournamentId) errors.push('Tournament ID is required');
    if (!gameId) errors.push('Game ID is required');
    
    // Determine scoring type
    let determinedScoreType = scoreType || 'team'; // Default to team
    
    // Auto-detect score type if not provided
    if (!scoreType) {
      if (playerScores && Array.isArray(playerScores) && playerScores.length > 0) {
        determinedScoreType = 'player';
      } else if (teamScores && Array.isArray(teamScores) && teamScores.length > 0) {
        determinedScoreType = 'team';
      }
    }
    
    // Validate score type
    if (!['team', 'player'].includes(determinedScoreType)) {
      errors.push('Score type must be either "team" or "player"');
    }
    
    // Validate scores based on type
    if (determinedScoreType === 'team') {
      // Validate team scores array
      if (!teamScores || !Array.isArray(teamScores)) {
        errors.push('Team scores must be provided as an array');
      } else {
        // Validate each team score
        teamScores.forEach((teamScore, index) => {
          const teamPrefix = `Team ${index + 1}`;
          
          if (!teamScore.team_id) errors.push(`${teamPrefix}: Team ID is required`);
          if (typeof teamScore.score !== 'number') errors.push(`${teamPrefix}: Total score must be a number`);
       
          // Validate player scores if provided (nested within team)
          if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
            teamScore.playerScores.forEach((playerScore, playerIndex) => {
              const playerPrefix = `${teamPrefix}, Player ${playerIndex + 1}`;
              
              if (!playerScore.player_id) errors.push(`${playerPrefix}: Player ID is required`);
              if (typeof playerScore.score !== 'number') errors.push(`${playerPrefix}: Score must be a number`);
            });
          }
        });
        
        // Check for duplicate team IDs
        const teamIds = teamScores.map(ts => ts.team_id).filter(Boolean);
        const duplicateTeamIds = teamIds.filter((id, index) => teamIds.indexOf(id) !== index);
        if (duplicateTeamIds.length > 0) {
          errors.push(`Duplicate team IDs found: ${duplicateTeamIds.join(', ')}`);
        }
      }
    } else {
      // Validate player scores array
      if (!playerScores || !Array.isArray(playerScores)) {
        errors.push('Player scores must be provided as an array');
      } else {
        // Validate each player score
        playerScores.forEach((playerScore, index) => {
          const playerPrefix = `Player ${index + 1}`;
          
          if (!playerScore.player_id) errors.push(`${playerPrefix}: Player ID is required`);
          if (typeof playerScore.score !== 'number') errors.push(`${playerPrefix}: Score must be a number`);
        });
        
        // Check for duplicate player IDs
        const playerIds = playerScores.map(ps => ps.playerId).filter(Boolean);
        const duplicatePlayerIds = playerIds.filter((id, index) => playerIds.indexOf(id) !== index);
        if (duplicatePlayerIds.length > 0) {
          errors.push(`Duplicate player IDs found: ${duplicatePlayerIds.join(', ')}`);
        }
      }
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Check tournament exists
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Validate game is part of tournament

    const isGameInTournament = await this.tournamentRepository.getTournamentGame(tournamentId, gameId);


    if (!isGameInTournament) {
      return res.status(400).json({
        success: false,
        message: 'Game is not part of this tournament'
      });
    }

    // Transform scores to match repository expectations
    let transformedScores;
    
    if (determinedScoreType === 'team') {
      // FIX: Transform team scores to the format expected by your database method
      transformedScores = teamScores.map(teamScore => ({
        team_id: teamScore.team_id,  // Make sure this matches your DB method expectation
        score: teamScore.score,      // This should be the score value
        reason: teamScore.reason || `Game ${gameId} completion`
      }));
    } else {
      transformedScores = playerScores.map(playerScore => ({
        player_id: playerScore.player_id,
        team_id: playerScore.team_id,
        score: playerScore.score,
        reason: playerScore.reason || `Game ${gameId} completion`
      }));
    }

    // *** THIS IS THE MISSING PIECE! ***
    // Actually call your database method to save the scores
    const saveResult = await this.leaderboardScoringRepository.recordGameScores(
      tournamentId,
      gameId,
      transformedScores,
      determinedScoreType,
      io
    );

    // Generate score summary for response
    let scoreSummary;
    
    if (determinedScoreType === 'team') {
      const totalTeams = teamScores.length;
      const scoreRanges = teamScores.map(team => team.score);
      const highestScore = Math.max(...scoreRanges);
      const lowestScore = Math.min(...scoreRanges);
      const averageScore = scoreRanges.reduce((sum, score) => sum + score, 0) / totalTeams;

      scoreSummary = {
        scoreType: 'team',
        totalTeams,
        scoreStatistics: {
          highest: highestScore,
          lowest: lowestScore,
          average: Math.round(averageScore * 100) / 100
        },
        recordedScores: teamScores.map(team => ({
          teamId: team.team_id,
          score: team.score
        }))
      };
    } else {
      const totalPlayers = playerScores.length;
      const scoreRanges = playerScores.map(player => player.score);
      const highestScore = Math.max(...scoreRanges);
      const lowestScore = Math.min(...scoreRanges);
      const averageScore = scoreRanges.reduce((sum, score) => sum + score, 0) / totalPlayers;

      scoreSummary = {
        scoreType: 'player',
        totalPlayers,
        scoreStatistics: {
          highest: highestScore,
          lowest: lowestScore,
          average: Math.round(averageScore * 100) / 100
        },
        recordedScores: playerScores.map(player => ({
          playerId: player.playerId,
          teamId: player.teamId,
          score: player.score
        }))
      };
    }

    res.status(200).json({
      success: true,
      message: `Game scores recorded successfully (${determinedScoreType} scoring)`,
      data: {
        tournament: {
          id: tournamentId,
          name: tournament.name,
          gameId: gameId
        },
        summary: scoreSummary,
        requestId: saveResult.requestId
      }
    });

  } catch (error) {
    console.error('Error recording game scores:', error);
    
    // Enhanced error response based on error type
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message,
        details: error.errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'Please provide valid tournament and game IDs'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record game scores',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

  async getTournamentLeaderboard(req, res) {
    try {
      const { tournamentId } = req.params;
      const { includeGameDetails = false } = req.query;

      const tournament = await this.tournamentRepository.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      const leaderboard = await this.leaderboardRankingRepository.getDetailedLeaderboard(tournamentId);
      
      if (includeGameDetails === 'true') {
        // Populate game details for each game leaderboard
        for (let gameLeaderboard of leaderboard.gameLeaderboards) {
          const game = await this.gameRepository.findById(gameLeaderboard.gameId);
          if (game) {
            gameLeaderboard.gameDetails = {
              name: game.name,
              description: game.description,
              category: game.category,
              difficulty: game.difficulty
            };
          }
        }
      }

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get tournament leaderboard',
        error: error.message
      });
    }
  }

  async getGameLeaderboard(req, res) {
    try {
      const { tournamentId, gameId } = req.params;

      const tournament = await this.tournamentRepository.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      const gameLeaderboard = tournament.leaderboard.gameLeaderboards.find(
        gl => gl.gameId.toString() === gameId
      );

      if (!gameLeaderboard) {
        return res.status(404).json({
          success: false,
          message: 'Game leaderboard not found'
        });
      }

      // Get game details
      const game = await this.gameRepository.findById(gameId);
      
      res.status(200).json({
        success: true,
        data: {
          game: {
            id: gameId,
            name: game?.name || 'Unknown Game',
            description: game?.description || ''
          },
          leaderboard: gameLeaderboard,
          lastUpdated: tournament.leaderboard.lastUpdated
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get game leaderboard',
        error: error.message
      });
    }
  }
}

export default LeaderboardScoringController;