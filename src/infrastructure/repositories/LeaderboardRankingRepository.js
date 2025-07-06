import mongoose from 'mongoose';

class LeaderboardRankingRepository {
  constructor(tournamentRepository) {
    // Receive tournamentRepository as a dependency
    this.tournamentRepository = tournamentRepository;
    
    // Add a check to ensure the dependency is properly injected
    if (!this.tournamentRepository) {
      throw new Error('TournamentRepository is required for LeaderboardRankingRepository');
    }
  }

  async getDetailedLeaderboard(tournamentId) {
    try {
      console.log('Getting detailed leaderboard for tournament:', tournamentId);
      
      if (!tournamentId) {
        throw new Error('Tournament ID is required');
      }

      const tournament = await this.tournamentRepository.model.findById(tournamentId);
      console.log('Tournament found for leaderboard:', tournament ? 'Yes' : 'No');
      
      if (!tournament) {
        throw new Error(`Tournament not found with ID: ${tournamentId}`);
      }

      // Ensure rankings are up to date before returning
      if (tournament.leaderboard && tournament.leaderboard.gameLeaderboards) {
        for (const gameLeaderboard of tournament.leaderboard.gameLeaderboards) {
          if (gameLeaderboard.teamScores && Array.isArray(gameLeaderboard.teamScores)) {
            // Sort and rank team scores
            gameLeaderboard.teamScores.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
            gameLeaderboard.teamScores.forEach((teamScore, index) => {
              teamScore.rank = index + 1;
            });
          }
        }
      }

      // Return the tournament's leaderboard or empty structure
      return tournament.leaderboard || {
        overallLeaderboard: [],
        gameLeaderboards: [],
        lastUpdated: null
      };

    } catch (error) {
      console.error('Error getting detailed leaderboard:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Error getting leaderboard: ${error.message}`);
    }
  }

  // Enhanced calculateOverallLeaderboard method with proper ranking
  async calculateOverallLeaderboard(tournament) {
    try {
      console.log('Calculating overall leaderboard...');
      
      // Validate tournament parameter
      if (!tournament) {
        throw new Error('Tournament parameter is required');
      }

      // Initialize leaderboard structure if it doesn't exist
      if (!tournament.leaderboard) {
        tournament.leaderboard = {
          overallLeaderboard: [],
          gameLeaderboards: [],
          lastUpdated: new Date()
        };
      }

      // Initialize overall leaderboard if it doesn't exist
      if (!tournament.leaderboard.overallLeaderboard) {
        tournament.leaderboard.overallLeaderboard = [];
      }

      // Ensure gameLeaderboards is an array
      if (!Array.isArray(tournament.leaderboard.gameLeaderboards)) {
        tournament.leaderboard.gameLeaderboards = [];
      }

      // Create a map to accumulate scores across all games
      const teamTotals = new Map();
      const playerTotals = new Map();

      // STEP 1: Process each game's leaderboard and calculate individual game rankings
      for (const gameLeaderboard of tournament.leaderboard.gameLeaderboards) {
        if (!gameLeaderboard || !gameLeaderboard.gameId) {
          console.warn('Invalid game leaderboard found, skipping...');
          continue;
        }

        console.log(`Processing game ${gameLeaderboard.gameId} for overall leaderboard...`);
        
        // Ensure arrays are properly initialized
        if (!Array.isArray(gameLeaderboard.teamScores)) {
          console.warn(`Game ${gameLeaderboard.gameId} has invalid teamScores, initializing as empty array`);
          gameLeaderboard.teamScores = [];
        }
        if (!Array.isArray(gameLeaderboard.playerScores)) {
          console.warn(`Game ${gameLeaderboard.gameId} has invalid playerScores, initializing as empty array`);
          gameLeaderboard.playerScores = [];
        }
        
        // CALCULATE INDIVIDUAL GAME RANKINGS FIRST
        // Sort teams within this game by their score in this game
        gameLeaderboard.teamScores.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        
        // Add game-specific ranking to each team score
        gameLeaderboard.teamScores.forEach((teamScore, index) => {
          if (teamScore) {
            teamScore.gameRank = index + 1; // Rank within this specific game
          }
        });
        
        // Sort players within this game by their score in this game
        gameLeaderboard.playerScores.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Add game-specific ranking to each player score
        gameLeaderboard.playerScores.forEach((playerScore, index) => {
          if (playerScore) {
            playerScore.gameRank = index + 1; // Rank within this specific game
          }
        });
        
        // ACCUMULATE SCORES FOR OVERALL RANKINGS
        // Accumulate team scores across all games
        for (const teamScore of gameLeaderboard.teamScores) {
          if (!teamScore || !teamScore.teamId) {
            console.warn('Invalid team score found, skipping...');
            continue;
          }

          const teamId = teamScore.teamId.toString();
          
          if (!teamTotals.has(teamId)) {
            teamTotals.set(teamId, {
              teamId: teamScore.teamId,
              totalTeamBonusScore: 0,
              totalIndividualPlayerScore: 0,
              totalScore: 0,
              gamesPlayed: 0,
              gameBreakdown: [],
              lastUpdated: new Date()
            });
          }
          
          const teamTotal = teamTotals.get(teamId);
          teamTotal.totalTeamBonusScore += (teamScore.teamBonusScore || 0);
          teamTotal.totalIndividualPlayerScore += (teamScore.individualPlayerScore || 0);
          teamTotal.totalScore += (teamScore.totalScore || 0);
          teamTotal.gamesPlayed += 1;
          teamTotal.gameBreakdown.push({
            gameId: gameLeaderboard.gameId,
            teamBonusScore: teamScore.teamBonusScore || 0,
            individualPlayerScore: teamScore.individualPlayerScore || 0,
            totalScore: teamScore.totalScore || 0,
            gameRank: teamScore.gameRank || 0 // Include the individual game rank
          });
          teamTotal.lastUpdated = new Date();
        }
        
        // Accumulate player scores across all games
        for (const playerScore of gameLeaderboard.playerScores) {
          if (!playerScore || !playerScore.playerId) {
            console.warn('Invalid player score found, skipping...');
            continue;
          }

          const playerId = playerScore.playerId.toString();
          
          if (!playerTotals.has(playerId)) {
            playerTotals.set(playerId, {
              playerId: playerScore.playerId,
              teamId: playerScore.teamId,
              totalScore: 0,
              gamesPlayed: 0,
              gameBreakdown: [],
              achievements: [],
              totalPlayTime: 0,
              lastUpdated: new Date()
            });
          }
          
          const playerTotal = playerTotals.get(playerId);
          playerTotal.totalScore += (playerScore.score || 0);
          playerTotal.gamesPlayed += 1;
          playerTotal.gameBreakdown.push({
            gameId: gameLeaderboard.gameId,
            score: playerScore.score || 0,
            performanceRating: playerScore.performanceRating,
            gameRank: playerScore.gameRank || 0 // Include the individual game rank
          });
          playerTotal.achievements = [...playerTotal.achievements, ...(playerScore.achievements || [])];
          playerTotal.totalPlayTime += (playerScore.playTime || 0);
          playerTotal.lastUpdated = new Date();
        }
      }

      // STEP 2: Calculate overall rankings across all games
      // Convert maps to arrays and sort by total score
      const overallTeamRankings = Array.from(teamTotals.values())
        .sort((a, b) => b.totalScore - a.totalScore);
      
      const overallPlayerRankings = Array.from(playerTotals.values())
        .sort((a, b) => b.totalScore - a.totalScore);

      // Add overall rankings
      overallTeamRankings.forEach((team, index) => {
        team.overallRank = index + 1;
      });
      
      overallPlayerRankings.forEach((player, index) => {
        player.overallRank = index + 1;
      });

      // Update the overall leaderboard
      tournament.leaderboard.overallLeaderboard = {
        teamRankings: overallTeamRankings,
        playerRankings: overallPlayerRankings,
        lastUpdated: new Date()
      };

      console.log('Overall leaderboard calculated successfully');
      console.log('Team rankings:', overallTeamRankings.length);
      console.log('Player rankings:', overallPlayerRankings.length);
      
      return tournament.leaderboard.overallLeaderboard;
      
    } catch (error) {
      console.error('Error calculating overall leaderboard:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Error calculating overall leaderboard: ${error.message}`);
    }
  }

  // Enhanced method to get rankings for a specific game
  async getGameRankings(tournamentId, gameId) {
    try {
      console.log('Getting game rankings for tournament:', tournamentId, 'game:', gameId);
      
      const tournament = await this.tournamentRepository.model.findById(tournamentId);
      if (!tournament || !tournament.leaderboard) {
        throw new Error('Tournament or leaderboard not found');
      }

      if (!Array.isArray(tournament.leaderboard.gameLeaderboards)) {
        throw new Error('Game leaderboards not properly initialized');
      }

      const gameLeaderboard = tournament.leaderboard.gameLeaderboards.find(
        gl => gl && gl.gameId && gl.gameId.toString() === gameId.toString()
      );

      if (!gameLeaderboard) {
        throw new Error(`Game leaderboard not found for game: ${gameId}`);
      }

      // Ensure arrays exist
      if (!Array.isArray(gameLeaderboard.teamScores)) {
        gameLeaderboard.teamScores = [];
      }
      if (!Array.isArray(gameLeaderboard.playerScores)) {
        gameLeaderboard.playerScores = [];
      }

      // Ensure rankings are up to date
      gameLeaderboard.teamScores.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      gameLeaderboard.teamScores.forEach((teamScore, index) => {
        if (teamScore) {
          teamScore.gameRank = index + 1;
        }
      });

      gameLeaderboard.playerScores.sort((a, b) => (b.score || 0) - (a.score || 0));
      gameLeaderboard.playerScores.forEach((playerScore, index) => {
        if (playerScore) {
          playerScore.gameRank = index + 1;
        }
      });

      return {
        gameId: gameId,
        teamRankings: gameLeaderboard.teamScores.map(ts => ({
          teamId: ts.teamId,
          gameRank: ts.gameRank,
          totalScore: ts.totalScore,
          teamBonusScore: ts.teamBonusScore,
          individualPlayerScore: ts.individualPlayerScore,
          playerScores: ts.playerScores
        })),
        playerRankings: gameLeaderboard.playerScores.map(ps => ({
          playerId: ps.playerId,
          teamId: ps.teamId,
          gameRank: ps.gameRank,
          score: ps.score,
          performanceRating: ps.performanceRating
        })),
        lastUpdated: gameLeaderboard.lastUpdated
      };

    } catch (error) {
      console.error('Error getting game rankings:', error);
      throw new Error(`Error getting game rankings: ${error.message}`);
    }
  }

  // Enhanced method to get overall rankings across all games
  async getOverallRankings(tournamentId) {
    try {
      console.log('Getting overall rankings for tournament:', tournamentId);
      
      const tournament = await this.tournamentRepository.model.findById(tournamentId);
      if (!tournament || !tournament.leaderboard) {
        throw new Error('Tournament or leaderboard not found');
      }

      // Ensure overall leaderboard is up to date
      await this.calculateOverallLeaderboard(tournament);
      await tournament.save();

      const overallLeaderboard = tournament.leaderboard.overallLeaderboard;

      if (!overallLeaderboard || !Array.isArray(overallLeaderboard.teamRankings) || !Array.isArray(overallLeaderboard.playerRankings)) {
        throw new Error('Overall leaderboard not properly initialized');
      }

      return {
        teamRankings: overallLeaderboard.teamRankings.map(tr => ({
          teamId: tr.teamId,
          overallRank: tr.overallRank,
          totalScore: tr.totalScore,
          totalTeamBonusScore: tr.totalTeamBonusScore,
          totalIndividualPlayerScore: tr.totalIndividualPlayerScore,
          gamesPlayed: tr.gamesPlayed,
          gameBreakdown: tr.gameBreakdown, // Shows rank and score for each game
          lastUpdated: tr.lastUpdated
        })),
        playerRankings: overallLeaderboard.playerRankings.map(pr => ({
          playerId: pr.playerId,
          teamId: pr.teamId,
          overallRank: pr.overallRank,
          totalScore: pr.totalScore,
          gamesPlayed: pr.gamesPlayed,
          gameBreakdown: pr.gameBreakdown, // Shows rank and score for each game
          achievements: pr.achievements,
          totalPlayTime: pr.totalPlayTime,
          lastUpdated: pr.lastUpdated
        })),
        lastUpdated: overallLeaderboard.lastUpdated
      };

    } catch (error) {
      console.error('Error getting overall rankings:', error);
      throw new Error(`Error getting overall rankings: ${error.message}`);
    }
  }

  // Enhanced method to get combined rankings (both game-specific and overall)
  async getCombinedRankings(tournamentId, gameId = null) {
    try {
      console.log('Getting combined rankings for tournament:', tournamentId);
      
      const tournament = await this.tournamentRepository.model.findById(tournamentId);
      if (!tournament || !tournament.leaderboard) {
        throw new Error('Tournament or leaderboard not found');
      }

      // Ensure overall leaderboard is up to date
      await this.calculateOverallLeaderboard(tournament);
      await tournament.save();

      const result = {
        overallRankings: tournament.leaderboard.overallLeaderboard,
        gameRankings: {}
      };

      // Get specific game rankings if gameId is provided
      if (gameId) {
        try {
          const gameRankings = await this.getGameRankings(tournamentId, gameId);
          result.gameRankings[gameId] = gameRankings;
        } catch (gameError) {
          console.warn(`Could not get rankings for game ${gameId}:`, gameError.message);
        }
      } else {
        // Get all game rankings
        if (Array.isArray(tournament.leaderboard.gameLeaderboards)) {
          for (const gameLeaderboard of tournament.leaderboard.gameLeaderboards) {
            if (gameLeaderboard && gameLeaderboard.gameId) {
              try {
                const gameRankings = await this.getGameRankings(tournamentId, gameLeaderboard.gameId);
                result.gameRankings[gameLeaderboard.gameId] = gameRankings;
              } catch (gameError) {
                console.warn(`Could not get rankings for game ${gameLeaderboard.gameId}:`, gameError.message);
              }
            }
          }
        }
      }

      return result;

    } catch (error) {
      console.error('Error getting combined rankings:', error);
      throw new Error(`Error getting combined rankings: ${error.message}`);
    }
  }

  // NEW: Helper method to recalculate all rankings
  async recalculateAllRankings(tournamentId) {
    try {
      const tournament = await this.tournamentRepository.model.findById(tournamentId);
      if (!tournament || !tournament.leaderboard) {
        throw new Error('Tournament or leaderboard not found');
      }

      // Ensure gameLeaderboards is an array
      if (!Array.isArray(tournament.leaderboard.gameLeaderboards)) {
        tournament.leaderboard.gameLeaderboards = [];
      }

      // Recalculate rankings for each game leaderboard
      for (const gameLeaderboard of tournament.leaderboard.gameLeaderboards) {
        if (gameLeaderboard && Array.isArray(gameLeaderboard.teamScores)) {
          // Sort by totalScore (descending)
          gameLeaderboard.teamScores.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
          
          // Assign ranks
          gameLeaderboard.teamScores.forEach((teamScore, index) => {
            if (teamScore) {
              teamScore.rank = index + 1;
            }
          });
        }
      }

      // Recalculate overall leaderboard
      await this.calculateOverallLeaderboard(tournament);

      // Update timestamp
      tournament.leaderboard.lastUpdated = new Date();

      // Save the updated tournament
      await tournament.save();

      return tournament;
    } catch (error) {
      console.error('Error recalculating all rankings:', error);
      throw new Error(`Error recalculating rankings: ${error.message}`);
    }
  }
}

export default LeaderboardRankingRepository;