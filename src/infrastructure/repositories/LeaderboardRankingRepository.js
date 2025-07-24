

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
    
      if (!tournamentId) {
        throw new Error('Tournament ID is required');
      }

      const tournament = await this.tournamentRepository.model.findById(tournamentId);
    
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

}

export default LeaderboardRankingRepository;