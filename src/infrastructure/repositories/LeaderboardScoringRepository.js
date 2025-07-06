import mongoose from "mongoose";

class LeaderboardScoringRepository {
  constructor(tournamentRepository, leaderboardRankingRepository) {
    this.tournamentRepository = tournamentRepository;
    this.leaderboardRankingRepository = leaderboardRankingRepository;
  }

  async recordGameScores(tournamentId, gameId, transformedScores, scoreType) {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!transformedScores || !Array.isArray(transformedScores)) {
          throw new Error('Transformed scores must be a valid array');
        }
        
        const tournament = await this.tournamentRepository.model.findById(
          new mongoose.Types.ObjectId(tournamentId)
        );
        
        if (!tournament) {
          throw new Error(`Tournament not found with ID: ${tournamentId}`);
        }

        if (!tournament.leaderboard) {
          tournament.leaderboard = {
            overallLeaderboard: [],
            gameLeaderboards: [],
            lastUpdated: new Date()
          };
        }

        if (!Array.isArray(tournament.leaderboard.gameLeaderboards)) {
          tournament.leaderboard.gameLeaderboards = [];
        }

        let gameLeaderboard = tournament.leaderboard.gameLeaderboards.find(
          gl => gl && gl.gameId && gl.gameId.toString() === gameId.toString()
        );

        if (!gameLeaderboard) {
          gameLeaderboard = {
            gameId: gameId,
            teamScores: [],
            playerScores: [],
            scoreHistory: [],
            lastUpdated: new Date()
          };
          tournament.leaderboard.gameLeaderboards.push(gameLeaderboard);
        }

        this.ensureArraysInitialized(gameLeaderboard);

        const historyEntry = {
          timestamp: new Date(),
          scoreType: scoreType,
          scores: JSON.parse(JSON.stringify(transformedScores)),
          entryId: new mongoose.Types.ObjectId()
        };
        gameLeaderboard.scoreHistory.push(historyEntry);

        if (scoreType === 'team') {
          await this.processTeamScores(gameLeaderboard, transformedScores);
        } else {
          await this.processPlayerScores(gameLeaderboard, transformedScores);
        }

        await this.calculateTeamTotalsWithPlayerScores(gameLeaderboard);

        gameLeaderboard.teamScores.sort((a, b) => 
          (b.totalScoreWithPlayers || 0) - (a.totalScoreWithPlayers || 0)
        );

        gameLeaderboard.lastUpdated = new Date();
        tournament.leaderboard.lastUpdated = new Date();

        const savedTournament = await tournament.save();
        
        await this.leaderboardRankingRepository.calculateOverallLeaderboard(savedTournament);
        
        const finalTournament = await savedTournament.save();
        
        return finalTournament;

      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw new Error(`Error recording game scores: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
    
    throw new Error(`Error recording game scores: ${lastError.message}`);
  }

  ensureArraysInitialized(gameLeaderboard) {
    if (!Array.isArray(gameLeaderboard.teamScores)) {
      console.warn('teamScores is not an array, reinitializing...');
      gameLeaderboard.teamScores = [];
    }
    if (!Array.isArray(gameLeaderboard.playerScores)) {
      console.warn('playerScores is not an array, reinitializing...');
      gameLeaderboard.playerScores = [];
    }
    if (!Array.isArray(gameLeaderboard.scoreHistory)) {
      console.warn('scoreHistory is not an array, reinitializing...');
      gameLeaderboard.scoreHistory = [];
    }
  }

  async processTeamScores(gameLeaderboard, transformedScores) {
    for (const teamScore of transformedScores) {
      if (!teamScore || !teamScore.teamId) continue;
      
      let existingTeamScore = gameLeaderboard.teamScores.find(
        ts => ts && ts.teamId && ts.teamId.toString() === teamScore.teamId.toString()
      );

      if (existingTeamScore) {
        // Initialize scoreHistory if it doesn't exist
        if (!Array.isArray(existingTeamScore.scoreHistory)) {
          existingTeamScore.scoreHistory = [];
        }

        const previousScores = {
          teamBonusScore: existingTeamScore.teamBonusScore || 0,
          individualPlayerScore: existingTeamScore.individualPlayerScore || 0,
          totalScore: existingTeamScore.totalScore || 0
        };

        // Update team scores
        existingTeamScore.teamBonusScore = (existingTeamScore.teamBonusScore || 0) + (teamScore.teamBonusScore || 0);
        existingTeamScore.individualPlayerScore = (existingTeamScore.individualPlayerScore || 0) + (teamScore.individualPlayerScore || 0);
        existingTeamScore.totalScore = (existingTeamScore.totalScore || 0) + (teamScore.totalScore || 0);
        
        // Add to score history
        existingTeamScore.scoreHistory.push({
          timestamp: new Date(),
          previousScores: previousScores,
          scoresAdded: {
            teamBonusScore: teamScore.teamBonusScore || 0,
            individualPlayerScore: teamScore.individualPlayerScore || 0,
            totalScore: teamScore.totalScore || 0
          },
          newTotalScores: {
            teamBonusScore: existingTeamScore.teamBonusScore,
            individualPlayerScore: existingTeamScore.individualPlayerScore,
            totalScore: existingTeamScore.totalScore
          }
        });

        // Process player scores within team
        if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
          // Initialize playerScores array if it doesn't exist
          if (!Array.isArray(existingTeamScore.playerScores)) {
            existingTeamScore.playerScores = [];
          }

          for (const newPlayerScore of teamScore.playerScores) {
            this.updatePlayerScoreInTeam(existingTeamScore, newPlayerScore);
          }
        }
        
        existingTeamScore.metadata = { ...existingTeamScore.metadata, ...teamScore.metadata };
        existingTeamScore.lastUpdated = new Date();
      } else {
        // Create new team score
        const newTeamScore = {
          teamId: teamScore.teamId,
          teamBonusScore: teamScore.teamBonusScore || 0,
          individualPlayerScore: teamScore.individualPlayerScore || 0,
          totalScore: teamScore.totalScore || 0,
          playerScores: [],
          metadata: teamScore.metadata || {},
          recordedAt: new Date(),
          lastUpdated: new Date(),
          scoreHistory: [{
            timestamp: new Date(),
            previousScores: { teamBonusScore: 0, individualPlayerScore: 0, totalScore: 0 },
            scoresAdded: {
              teamBonusScore: teamScore.teamBonusScore || 0,
              individualPlayerScore: teamScore.individualPlayerScore || 0,
              totalScore: teamScore.totalScore || 0
            },
            newTotalScores: {
              teamBonusScore: teamScore.teamBonusScore || 0,
              individualPlayerScore: teamScore.individualPlayerScore || 0,
              totalScore: teamScore.totalScore || 0
            }
          }]
        };

        if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
          newTeamScore.playerScores = teamScore.playerScores.map(ps => {
            const cleanedScore = this.validateAndCleanPlayerScore(ps, teamScore.teamId);
            cleanedScore.scoreHistory = [{
              timestamp: new Date(),
              previousScore: 0,
              scoreAdded: ps.score || 0,
              newTotalScore: ps.score || 0
            }];
            return cleanedScore;
          });
        }

        gameLeaderboard.teamScores.push(newTeamScore);
      }

      // Update individual player scores
      if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
        for (const playerScore of teamScore.playerScores) {
          this.updateIndividualPlayerScore(gameLeaderboard, playerScore, teamScore.teamId);
        }
      }
    }
  }

  updatePlayerScoreInTeam(existingTeamScore, newPlayerScore) {
    const existingPlayerInTeam = existingTeamScore.playerScores.find(
      ps => ps && ps.playerId && ps.playerId.toString() === newPlayerScore.playerId.toString()
    );

    if (existingPlayerInTeam) {
      if (!Array.isArray(existingPlayerInTeam.scoreHistory)) {
        existingPlayerInTeam.scoreHistory = [];
      }

      const previousScore = existingPlayerInTeam.score || 0;
      existingPlayerInTeam.score = (existingPlayerInTeam.score || 0) + (newPlayerScore.score || 0);

      existingPlayerInTeam.scoreHistory.push({
        timestamp: new Date(),
        previousScore: previousScore,
        scoreAdded: newPlayerScore.score || 0,
        newTotalScore: existingPlayerInTeam.score
      });
    } else {
      const cleanedPlayerScore = this.validateAndCleanPlayerScore(newPlayerScore, existingTeamScore.teamId);
      cleanedPlayerScore.scoreHistory = [{
        timestamp: new Date(),
        previousScore: 0,
        scoreAdded: newPlayerScore.score || 0,
        newTotalScore: newPlayerScore.score || 0
      }];
      existingTeamScore.playerScores.push(cleanedPlayerScore);
    }
  }

  async processPlayerScores(gameLeaderboard, transformedScores) { 
    for (const playerScore of transformedScores) {
      if (!playerScore || !playerScore.playerId) continue;
      
      try {
        const cleanedPlayerScore = this.validateAndCleanPlayerScore(playerScore);
        
        this.updateIndividualPlayerScore(gameLeaderboard, cleanedPlayerScore);

        if (playerScore.teamId) {
          this.updateTeamScoreFromPlayerScore(gameLeaderboard, playerScore);
        }
        
      } catch (playerProcessingError) {
        console.error('Error processing player score:', playerProcessingError);
        continue;
      }
    }
  }

  updateIndividualPlayerScore(gameLeaderboard, playerScore, teamId = null) {
    let existingPlayerScore = gameLeaderboard.playerScores.find(
      ps => ps && ps.playerId && ps.playerId.toString() === playerScore.playerId.toString()
    );

    const cleanedPlayerScore = this.validateAndCleanPlayerScore(playerScore, teamId);

    if (existingPlayerScore) {
      if (!Array.isArray(existingPlayerScore.scoreHistory)) {
        existingPlayerScore.scoreHistory = [];
      }

      const previousScore = existingPlayerScore.score || 0;
      existingPlayerScore.score = (existingPlayerScore.score || 0) + (cleanedPlayerScore.score || 0);
      
      existingPlayerScore.scoreHistory.push({
        timestamp: new Date(),
        previousScore: previousScore,
        scoreAdded: cleanedPlayerScore.score || 0,
        newTotalScore: existingPlayerScore.score
      });

      existingPlayerScore.metadata = { ...existingPlayerScore.metadata, ...cleanedPlayerScore.metadata };
      existingPlayerScore.lastUpdated = new Date();
    } else {
      cleanedPlayerScore.scoreHistory = [{
        timestamp: new Date(),
        previousScore: 0,
        scoreAdded: cleanedPlayerScore.score || 0,
        newTotalScore: cleanedPlayerScore.score || 0
      }];
      
      gameLeaderboard.playerScores.push(cleanedPlayerScore);
    }
  }

  updateTeamScoreFromPlayerScore(gameLeaderboard, playerScore) {
    const teamIdString = playerScore.teamId.toString();

    let existingTeamScore = gameLeaderboard.teamScores.find(
      ts => ts && ts.teamId && ts.teamId.toString() === teamIdString
    );

    if (existingTeamScore) {
      if (!Array.isArray(existingTeamScore.scoreHistory)) {
        existingTeamScore.scoreHistory = [];
      }

      if (!Array.isArray(existingTeamScore.playerScores)) {
        existingTeamScore.playerScores = [];
      }

      this.updatePlayerScoreInTeam(existingTeamScore, playerScore);
    
      const previousScores = {
        teamBonusScore: existingTeamScore.teamBonusScore || 0,
        individualPlayerScore: existingTeamScore.individualPlayerScore || 0,
        totalScore: existingTeamScore.totalScore || 0
      };

      const totalIndividualScore = existingTeamScore.playerScores.reduce((sum, ps) => sum + (ps.score || 0), 0);
      existingTeamScore.individualPlayerScore = totalIndividualScore;
      existingTeamScore.totalScore = (existingTeamScore.teamBonusScore || 0) + totalIndividualScore;
      
      existingTeamScore.scoreHistory.push({
        timestamp: new Date(),
        previousScores: previousScores,
        scoresAdded: {
          teamBonusScore: 0,
          individualPlayerScore: (playerScore.score || 0),
          totalScore: (playerScore.score || 0)
        },
        newTotalScores: {
          teamBonusScore: existingTeamScore.teamBonusScore,
          individualPlayerScore: existingTeamScore.individualPlayerScore,
          totalScore: existingTeamScore.totalScore
        }
      });

      existingTeamScore.lastUpdated = new Date();
    } else {
      const cleanedPlayerScoreForTeam = this.validateAndCleanPlayerScore(playerScore, playerScore.teamId);
      cleanedPlayerScoreForTeam.scoreHistory = [{
        timestamp: new Date(),
        previousScore: 0,
        scoreAdded: playerScore.score || 0,
        newTotalScore: playerScore.score || 0
      }];
      
      const newTeamScore = {
        teamId: playerScore.teamId,
        teamBonusScore: 0,
        individualPlayerScore: playerScore.score || 0,
        totalScore: playerScore.score || 0,
        playerScores: [cleanedPlayerScoreForTeam],
        metadata: {},
        recordedAt: new Date(),
        lastUpdated: new Date(),
        scoreHistory: [{
          timestamp: new Date(),
          previousScores: { teamBonusScore: 0, individualPlayerScore: 0, totalScore: 0 },
          scoresAdded: {
            teamBonusScore: 0,
            individualPlayerScore: playerScore.score || 0,
            totalScore: playerScore.score || 0
          },
          newTotalScores: {
            teamBonusScore: 0,
            individualPlayerScore: playerScore.score || 0,
            totalScore: playerScore.score || 0
          }
        }]
      };
      
      gameLeaderboard.teamScores.push(newTeamScore);
    }
  }

  async calculateTeamTotalsWithPlayerScores(gameLeaderboard) {
    for (const teamScore of gameLeaderboard.teamScores) {
      let teamTotalScore = teamScore.totalScore || 0;
      
      const teamPlayerScores = gameLeaderboard.playerScores.filter(
        ps => ps.teamId && ps.teamId.toString() === teamScore.teamId.toString()
      );
      
      const playersTotalScore = teamPlayerScores.reduce((sum, player) => {
        return sum + (player.score || 0);
      }, 0);
      
      teamScore.totalScoreWithPlayers = teamTotalScore + playersTotalScore;
      teamScore.teamOnlyScore = teamTotalScore;
      teamScore.playersOnlyScore = playersTotalScore;
      teamScore.playerCount = teamPlayerScores.length;
    }
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
    metadata: playerScore.metadata || {},
    recordedAt: new Date(),
    lastUpdated: new Date()
  };
}

// Enhanced score history entry with better negative score context
createScoreHistoryEntry(previousScore, scoreAdded, newTotalScore) {
  return {
    timestamp: new Date(),
    previousScore: previousScore,
    scoreAdded: scoreAdded,
    newTotalScore: newTotalScore,
    // Add context for negative scores
    isDeduction: scoreAdded < 0,
    isNegativeTotal: newTotalScore < 0
  };
}

// Enhanced team score processing with negative score awareness
async processTeamScores(gameLeaderboard, transformedScores) {
  for (const teamScore of transformedScores) {
    if (!teamScore || !teamScore.teamId) continue;
    
    let existingTeamScore = gameLeaderboard.teamScores.find(
      ts => ts && ts.teamId && ts.teamId.toString() === teamScore.teamId.toString()
    );

    if (existingTeamScore) {
      if (!Array.isArray(existingTeamScore.scoreHistory)) {
        existingTeamScore.scoreHistory = [];
      }

      const previousScores = {
        teamBonusScore: existingTeamScore.teamBonusScore || 0,
        individualPlayerScore: existingTeamScore.individualPlayerScore || 0,
        totalScore: existingTeamScore.totalScore || 0
      };

      // Handle negative scores explicitly
      const teamBonusToAdd = teamScore.teamBonusScore || 0;
      const individualPlayerToAdd = teamScore.individualPlayerScore || 0;
      const totalToAdd = teamScore.totalScore || 0;

      existingTeamScore.teamBonusScore += teamBonusToAdd;
      existingTeamScore.individualPlayerScore += individualPlayerToAdd;
      existingTeamScore.totalScore += totalToAdd;
      
      // Enhanced score history with negative score context
      existingTeamScore.scoreHistory.push({
        timestamp: new Date(),
        previousScores: previousScores,
        scoresAdded: {
          teamBonusScore: teamBonusToAdd,
          individualPlayerScore: individualPlayerToAdd,
          totalScore: totalToAdd
        },
        newTotalScores: {
          teamBonusScore: existingTeamScore.teamBonusScore,
          individualPlayerScore: existingTeamScore.individualPlayerScore,
          totalScore: existingTeamScore.totalScore
        },
        // Add flags for negative score tracking
        hasNegativeAddition: teamBonusToAdd < 0 || individualPlayerToAdd < 0 || totalToAdd < 0,
        resultingNegativeTotal: existingTeamScore.totalScore < 0
      });

      // Process player scores (including negative ones)
      if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
        if (!Array.isArray(existingTeamScore.playerScores)) {
          existingTeamScore.playerScores = [];
        }

        for (const newPlayerScore of teamScore.playerScores) {
          this.updatePlayerScoreInTeam(existingTeamScore, newPlayerScore);
        }
      }
      
      existingTeamScore.metadata = { ...existingTeamScore.metadata, ...teamScore.metadata };
      existingTeamScore.lastUpdated = new Date();
    } else {
      // Create new team score (can start with negative values)
      const newTeamScore = {
        teamId: teamScore.teamId,
        teamBonusScore: teamScore.teamBonusScore || 0,
        individualPlayerScore: teamScore.individualPlayerScore || 0,
        totalScore: teamScore.totalScore || 0,
        playerScores: [],
        metadata: teamScore.metadata || {},
        recordedAt: new Date(),
        lastUpdated: new Date(),
        scoreHistory: [{
          timestamp: new Date(),
          previousScores: { teamBonusScore: 0, individualPlayerScore: 0, totalScore: 0 },
          scoresAdded: {
            teamBonusScore: teamScore.teamBonusScore || 0,
            individualPlayerScore: teamScore.individualPlayerScore || 0,
            totalScore: teamScore.totalScore || 0
          },
          newTotalScores: {
            teamBonusScore: teamScore.teamBonusScore || 0,
            individualPlayerScore: teamScore.individualPlayerScore || 0,
            totalScore: teamScore.totalScore || 0
          },
          hasNegativeAddition: (teamScore.teamBonusScore || 0) < 0 || 
                              (teamScore.individualPlayerScore || 0) < 0 || 
                              (teamScore.totalScore || 0) < 0,
          resultingNegativeTotal: (teamScore.totalScore || 0) < 0
        }]
      };

      if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
        newTeamScore.playerScores = teamScore.playerScores.map(ps => {
          const cleanedScore = this.validateAndCleanPlayerScore(ps, teamScore.teamId);
          cleanedScore.scoreHistory = [this.createScoreHistoryEntry(0, ps.score || 0, ps.score || 0)];
          return cleanedScore;
        });
      }

      gameLeaderboard.teamScores.push(newTeamScore);
    }

    // Update individual player scores (including negative ones)
    if (teamScore.playerScores && Array.isArray(teamScore.playerScores)) {
      for (const playerScore of teamScore.playerScores) {
        this.updateIndividualPlayerScore(gameLeaderboard, playerScore, teamScore.teamId);
      }
    }
  }
}

// Method to get negative score statistics
getNegativeScoreStatistics(gameLeaderboard) {
  const stats = {
    teamsWithNegativeScores: 0,
    playersWithNegativeScores: 0,
    totalNegativeDeductions: 0,
    teamsBelow: gameLeaderboard.teamScores.filter(team => (team.totalScoreWithPlayers || 0) < 0),
    playersBelow: gameLeaderboard.playerScores.filter(player => (player.score || 0) < 0)
  };

  stats.teamsWithNegativeScores = stats.teamsBelow.length;
  stats.playersWithNegativeScores = stats.playersBelow.length;

  // Calculate total negative deductions from score history
  gameLeaderboard.teamScores.forEach(team => {
    if (Array.isArray(team.scoreHistory)) {
      team.scoreHistory.forEach(entry => {
        if (entry.scoresAdded && entry.scoresAdded.totalScore < 0) {
          stats.totalNegativeDeductions += Math.abs(entry.scoresAdded.totalScore);
        }
      });
    }
  });

  return stats;
}

  getPlayerScoreHistory(gameLeaderboard, playerId) {
    const result = {
      individualHistory: [],
      teamHistory: [],
      totalHistory: []
    };

    const individualPlayer = gameLeaderboard.playerScores.find(
      ps => ps && ps.playerId && ps.playerId.toString() === playerId.toString()
    );
    
    if (individualPlayer && Array.isArray(individualPlayer.scoreHistory)) {
      result.individualHistory = individualPlayer.scoreHistory;
    }

    gameLeaderboard.teamScores.forEach(teamScore => {
      if (Array.isArray(teamScore.playerScores)) {
        const playerInTeam = teamScore.playerScores.find(
          ps => ps && ps.playerId && ps.playerId.toString() === playerId.toString()
        );
        
        if (playerInTeam && Array.isArray(playerInTeam.scoreHistory)) {
          result.teamHistory.push({
            teamId: teamScore.teamId,
            scoreHistory: playerInTeam.scoreHistory
          });
        }
      }
    });

    const allEntries = [
      ...result.individualHistory.map(entry => ({ ...entry, source: 'individual' })),
      ...result.teamHistory.flatMap(team => 
        team.scoreHistory.map(entry => ({ ...entry, source: 'team', teamId: team.teamId }))
      )
    ];

    result.totalHistory = allEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return result;
  }

  getPlayerScoreSummary(gameLeaderboard, playerId) {
    const individualPlayer = gameLeaderboard.playerScores.find(
      ps => ps && ps.playerId && ps.playerId.toString() === playerId.toString()
    );

    let totalScoreFromTeams = 0;
    const teamContributions = [];

    gameLeaderboard.teamScores.forEach(teamScore => {
      if (Array.isArray(teamScore.playerScores)) {
        const playerInTeam = teamScore.playerScores.find(
          ps => ps && ps.playerId && ps.playerId.toString() === playerId.toString()
        );
        
        if (playerInTeam) {
          totalScoreFromTeams += playerInTeam.score || 0;
          teamContributions.push({
            teamId: teamScore.teamId,
            score: playerInTeam.score || 0,
            lastUpdated: playerInTeam.lastUpdated
          });
        }
      }
    });

    return {
      playerId: playerId,
      individualScore: individualPlayer ? individualPlayer.score || 0 : 0,
      teamContributions: teamContributions,
      totalScoreFromTeams: totalScoreFromTeams,
      overallTotal: (individualPlayer ? individualPlayer.score || 0 : 0) + totalScoreFromTeams,
      lastUpdated: individualPlayer ? individualPlayer.lastUpdated : null
    };
  }

  getGameScoreHistory(gameLeaderboard) {
    return Array.isArray(gameLeaderboard.scoreHistory) ? gameLeaderboard.scoreHistory : [];
  }

  async resetGameScores(tournamentId, gameId) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const tournament = await this.tournamentRepository.model.findById(tournamentId).session(session);
        if (!tournament) {
          throw new Error('Tournament not found');
        }

        if (tournament.leaderboard && Array.isArray(tournament.leaderboard.gameLeaderboards)) {
          const gameLeaderboardIndex = tournament.leaderboard.gameLeaderboards.findIndex(
            gl => gl && gl.gameId && gl.gameId.toString() === gameId.toString()
          );

          if (gameLeaderboardIndex !== -1) {
            tournament.leaderboard.gameLeaderboards.splice(gameLeaderboardIndex, 1);
            await this.leaderboardRankingRepository.calculateOverallLeaderboard(tournament);
            tournament.leaderboard.lastUpdated = new Date();
            await tournament.save({ session });
          }
        }

        return tournament;
      });
    } catch (error) {
      console.error('Error resetting game scores:', error);
      throw new Error(`Error resetting game scores: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }
}

export default LeaderboardScoringRepository;