import AnimalRepository from '../../infrastructure/repositories/AnimalRepository.js';
import GameRepository from '../../infrastructure/repositories/gameRepository.js';
import TournamentRepository from '../../infrastructure/repositories/TournamentRepository.js';
import LeaderboardScoringRepository from '../../infrastructure/repositories/LeaderboardScoringRepository.js';
import LeaderboardRankingRepository from '../../infrastructure/repositories/LeaderboardRankingRepository.js';

class LeaderboardScoringController {
  constructor() {
    this.animalRepository = new AnimalRepository();
    this.gameRepository = new GameRepository();
    this.tournamentRepository = new TournamentRepository();
    
    // IMPORTANT: Create ranking repository FIRST since scoring repository depends on it
    this.leaderboardRankingRepository = new LeaderboardRankingRepository(this.tournamentRepository);
    
    // Now create scoring repository with both required dependencies
    this.leaderboardScoringRepository = new LeaderboardScoringRepository(
      this.tournamentRepository,
      this.leaderboardRankingRepository
    );
  }

  // ===== LEADERBOARD AND SCORING METHODS =====

async recordGameScores(req, res) {
  try {
    const { tournamentId, gameId } = req.params;
    const { teamScores, playerScores, scoreType } = req.body;
    const io = req.app.get('io');

    // Inline validation
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
          
          if (!teamScore.teamId) errors.push(`${teamPrefix}: Team ID is required`);
          if (typeof teamScore.totalScore !== 'number') errors.push(`${teamPrefix}: Total score must be a number`);
          // Removed: if (teamScore.totalScore < 0) errors.push(`${teamPrefix}: Total score cannot be negative`);
          
          // Validate player scores if provided (nested within team)
          if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
            teamScore.playerScores.forEach((playerScore, playerIndex) => {
              const playerPrefix = `${teamPrefix}, Player ${playerIndex + 1}`;
              
              if (!playerScore.playerId) errors.push(`${playerPrefix}: Player ID is required`);
              if (typeof playerScore.score !== 'number') errors.push(`${playerPrefix}: Score must be a number`);
              // Note: Player scores can now be negative for deductions
            });
          }
        });
        
        // Check for duplicate team IDs
        const teamIds = teamScores.map(ts => ts.teamId).filter(Boolean);
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
          
          if (!playerScore.playerId) errors.push(`${playerPrefix}: Player ID is required`);
          if (typeof playerScore.score !== 'number') errors.push(`${playerPrefix}: Score must be a number`);
          // Note: Player scores can now be negative for deductions
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
    const isGameInTournament = tournament.selectedGames.some(game => 
       game._id.toString() === gameId
    );

    if (!isGameInTournament) {
      return res.status(400).json({
        success: false,
        message: 'Game is not part of this tournament'
      });
    }

    // Transform scores to match repository expectations
    let transformedScores;
    
    if (determinedScoreType === 'team') {
      transformedScores = teamScores.map(teamScore => {
        // Calculate individual player score sum (can be negative)
        const individualPlayerScore = teamScore.playerScores 
          ? teamScore.playerScores.reduce((sum, ps) => sum + (ps.score || 0), 0)
          : 0;
        
        // Calculate team bonus score as the difference (can be negative)
        const teamBonusScore = (teamScore.totalScore || 0) - individualPlayerScore;
        
        return {
          teamId: teamScore.teamId, // Make sure teamId is preserved
          teamBonusScore: teamBonusScore, // Removed Math.max(0, ...) to allow negative bonuses
          totalScore: teamScore.totalScore || 0,
          individualPlayerScore,
          playerScores: teamScore.playerScores ? teamScore.playerScores.map(ps => ({
            playerId: ps.playerId,
            score: ps.score || 0, // Can be negative
            performanceRating: ps.performanceRating || 'average',
            achievements: ps.achievements || [],
            playTime: ps.playTime || 0,
            metadata: ps.metadata || {}
          })) : [],
          metadata: teamScore.metadata || {}
        };
      });
    } else {
      // For player-only scoring, we may need to group by team or handle differently
      // Check if playerScores include teamId information
      transformedScores = playerScores.map(playerScore => ({
        playerId: playerScore.playerId,
        teamId: playerScore.teamId, // Include teamId if provided
        score: playerScore.score || 0, // Can be negative
        performanceRating: playerScore.performanceRating || 'average',
        achievements: playerScore.achievements || [],
        playTime: playerScore.playTime || 0,
        metadata: playerScore.metadata || {}
      }));
    }

    // Record the game scores with transformed data
    const updatedTournament = await this.leaderboardScoringRepository.recordGameScores(
      tournamentId, 
      gameId, 
      transformedScores,
      determinedScoreType,
      io
    );

    // Get comprehensive leaderboard data
    const leaderboard = await this.leaderboardRankingRepository.getDetailedLeaderboard(tournamentId);
    
    // Generate score summary based on type (using original scores for display)
    let scoreSummary;
    
    if (determinedScoreType === 'team') {
      const totalTeams = teamScores.length;
      const totalPlayers = teamScores.reduce((sum, team) => {
        return sum + (team.playerScores ? team.playerScores.length : 0);
      }, 0);

      const scoreRanges = teamScores.map(team => team.totalScore);
      const highestScore = Math.max(...scoreRanges);
      const lowestScore = Math.min(...scoreRanges);
      const averageScore = scoreRanges.reduce((sum, score) => sum + score, 0) / totalTeams;

      const teamsWithAdjustments = teamScores.filter(team => {
        const playerSum = team.playerScores?.reduce((sum, player) => sum + player.score, 0) || 0;
        return team.totalScore !== playerSum;
      }).length;

      scoreSummary = {
        scoreType: 'team',
        totalTeams,
        totalPlayers,
        scoreStatistics: {
          highest: highestScore,
          lowest: lowestScore,
          average: Math.round(averageScore * 100) / 100
        },
        teamsWithAdjustments,
        recordedScores: teamScores.map(team => {
          const playerSum = team.playerScores?.reduce((sum, player) => sum + player.score, 0) || 0;
          const bonusScore = team.totalScore - playerSum;
          
          return {
            teamId: team.teamId,
            totalScore: team.totalScore,
            individualPlayerScore: playerSum,
            teamBonusScore: bonusScore, // Removed Math.max(0, ...) to show actual bonus/penalty
            playerCount: team.playerScores?.length || 0
          };
        })
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
          teamId: player.teamId, // Include teamId if provided
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
        scoreSummary,
        leaderboard,
        recordedAt: new Date().toISOString()
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