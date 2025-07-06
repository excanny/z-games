import BaseRepository from './BaseRepository.js';
import Tournament from '../models/games/Tournament.js';
import Player from '../models/games/Player.js';
import Team from '../models/games/Team.js';
import Animal from '../models/games/Animal.js';
import Game from '../models/games/Game.js';

class TournamentRepository extends BaseRepository {
  constructor() {
    super(Tournament);
    this.playerModel = Player;
    this.teamModel = Team;
    this.animalModel = Animal;
    this.gameModel = Game;
  }

  async createTournament(payload) {
    try {
      const { tournament, teams } = payload;
      
      const createdPlayers = [];
      const createdTeams = [];
      
      for (const team of teams) {
        // Create team first (without players initially)
        const newTeam = await this.teamModel.create({
          name: team.name,
          players: [], // Will be populated with player ObjectIds
          totalPoints: 0,
          isActive: true,
          // Add any other team fields your Team model requires
        });
        createdTeams.push(newTeam._id);
        
        // Create standalone Player documents for this team
        const teamPlayerIds = [];
        
        for (const player of team.players) {
          // Find animal by name (map emoji to animal name if needed)
          let animalName = this.mapEmojiToAnimalName(player.avatar || player.animalAvatar);
          let animal = await this.animalModel.findOne({ name: animalName });
          
          if (!animal) {
            throw new Error(`Animal not found for: ${animalName}. Available animals: Lion, Tiger, Eagle, Cat, Shark, Dog, Whale, Horse, Bison, Moose, Goose, Turtle, Beaver, Bear, Frog, Rabbit, Wolf, Human, Monkey, Chameleon`);
          }
          
          // Create standalone Player document
          const newPlayer = await this.playerModel.create({
            name: player.name,
            animalAvatar: animal._id,
            teamId: newTeam._id,
            score: 0,
            contributionPercentage: 0,
            // Add any other player fields your Player model requires
          });
          
          createdPlayers.push(newPlayer._id);
          teamPlayerIds.push(newPlayer._id);
        }
        
        // Update team with player references (ObjectIds)
        newTeam.players = teamPlayerIds;
        await newTeam.save();
      }
      
      // Create tournament with references to teams and players
      const newTournament = {
        name: tournament.name,
        description: tournament.description,
        date: new Date(tournament.createdAt || Date.now()),
        teams: createdTeams,
        players: createdPlayers,
        selectedGames: tournament.selectedGames || [],
        status: 'pending',
        currentRoundNumber: 1,
        currentMatchNumber: 1,
        leaderboard: {
          lastUpdated: new Date(),
          gameLeaderboards: [],
          overallTeamRankings: [],
          overallPlayerRankings: [],
          winner: null
        },
        settings: {
          enableSuperpowers: true,
          monkeyDanceEnabled: true,
          randomPrizeDraws: true,
          gameMode: 'team_vs_team',
          scoringMode: 'cumulative',
          maxRounds: 10,
          timeLimit: 600,
          maxPlayersPerTeam: 4
        }
      };

      const createdTournament = await this.model.create(newTournament);
      return createdTournament;
      
    } catch (error) {
      throw new Error(`Error creating tournament: ${error.message}`);
    }
  }

  // Helper method to map emojis to animal names
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

  async addTeam(tournamentId, teamId) {
    try {
      const tournament = await this.model.findById(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      if (!tournament.teams.includes(teamId)) {
        tournament.teams.push(teamId);
        await tournament.save();
      }
      return tournament;
    } catch (error) {
      throw new Error(`Error adding team: ${error.message}`);
    }
  }

  // Method to update tournament status
  async updateTournamentStatus(tournamentId, status) {
    try {
      const tournament = await this.model.findById(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      tournament.status = status;
      
      // If completing tournament, update overall leaderboard and set winner
      if (status === 'completed') {
        await tournament.updateOverallLeaderboard();
      }

      await tournament.save();
      return tournament;
    } catch (error) {
      throw new Error(`Error updating tournament status: ${error.message}`);
    }
  }

  // Method to advance to next round
  async advanceToNextRound(tournamentId) {
    try {
      const tournament = await this.model.findById(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      tournament.currentRoundNumber += 1;
      tournament.currentMatchNumber = 1;
      
      await tournament.save();
      return tournament;
    } catch (error) {
      throw new Error(`Error advancing to next round: ${error.message}`);
    }
  }

  // Method to set current game
  async setCurrentGame(tournamentId, gameId) {
    try {
      const tournament = await this.model.findById(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      tournament.currentGameId = gameId;
      await tournament.save();
      return tournament;
    } catch (error) {
      throw new Error(`Error setting current game: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      let query = this.model.find();

      // Apply status filter if provided
      if (options.status) {
        query = query.where('status').equals(options.status);
      }

      // Apply pagination if provided
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        query = query.skip(skip);
      }

      const tournaments = await query
        .populate('teams', 'name')
        .populate('players', 'name')
        .populate('selectedGames', 'name')
        .sort({ createdAt: -1 });

      return tournaments;
    } catch (error) {
      throw new Error(`Error finding tournaments: ${error.message}`);
    }
  }

// async findById(id) {
//   try {
//     const tournament = await this.model.findById(id)
//       .populate({
//         path: 'teams',
//         populate: {
//           path: 'players',
//           populate: {
//             path: 'animalAvatar',
//             model: 'Animal'
//           }
//         }
//       })
//       .populate('selectedGames', 'name description category');

//     // Calculate total scores and rank teams
//     if (tournament && tournament.teams && tournament.leaderboard) {
//       // Create a map to store total scores for each team
//       const teamTotalScores = new Map();
      
//       // Initialize all teams with 0 score
//       tournament.teams.forEach(team => {
//         teamTotalScores.set(team._id.toString(), 0);
//       });
      
//       // Calculate total scores from leaderboard
//       if (tournament.leaderboard.gameLeaderboards) {
//         tournament.leaderboard.gameLeaderboards.forEach(gameLeaderboard => {
//           if (gameLeaderboard.teamScores) {
//             gameLeaderboard.teamScores.forEach(teamScore => {
//               const teamId = teamScore.teamId.toString();
//               const currentTotal = teamTotalScores.get(teamId) || 0;
//               teamTotalScores.set(teamId, currentTotal + (teamScore.totalScore || 0));
//             });
//           }
//         });
//       }
      
//       // Add total scores to team objects
//       tournament.teams.forEach(team => {
//         const totalScore = teamTotalScores.get(team._id.toString()) || 0;
//         // Make sure the property is added to the actual object
//         team.totalScore = totalScore;
//         team.set('totalScore', totalScore); // For Mongoose documents
//       });
      
//       // Sort teams by total score in descending order (highest score first)
//       tournament.teams.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      
//       // Add rank numbers to each team
//       tournament.teams.forEach((team, index) => {
//         const rank = index + 1;
//         team.rank = rank;
//         team.set('rank', rank); // For Mongoose documents
//       });
//     }

//     // Convert to plain object to ensure custom properties are included
//     const plainTournament = tournament.toObject ? tournament.toObject() : tournament;
    
//     // Re-add the calculated properties to the plain object
//     if (plainTournament.teams && tournament.teams) {
//       plainTournament.teams.forEach((team, index) => {
//         team.totalScore = tournament.teams[index].totalScore;
//         team.rank = tournament.teams[index].rank;
//       });
//     }

//     return plainTournament;
//   } catch (error) {
//     throw new Error(`Error finding tournament: ${error.message}`);
//   }
// }

async findById(id) {
  try {
    const tournament = await this.model.findById(id)
      .populate({
        path: 'teams',
        populate: {
          path: 'players',
          populate: {
            path: 'animalAvatar',
            model: 'Animal'
          }
        }
      })
      .populate('selectedGames', 'name description category');

    // Return null if tournament not found
    if (!tournament) {
      return null;
    }

    // Calculate total scores and rank teams
    if (tournament.teams && tournament.leaderboard) {
      // Create a map to store total scores for each team
      const teamTotalScores = new Map();
      
      // Initialize all teams with 0 score
      tournament.teams.forEach(team => {
        teamTotalScores.set(team._id.toString(), 0);
      });
      
      // Calculate total scores from leaderboard
      if (tournament.leaderboard.gameLeaderboards) {
        tournament.leaderboard.gameLeaderboards.forEach(gameLeaderboard => {
          if (gameLeaderboard.teamScores) {
            gameLeaderboard.teamScores.forEach(teamScore => {
              const teamId = teamScore.teamId.toString();
              const currentTotal = teamTotalScores.get(teamId) || 0;
              teamTotalScores.set(teamId, currentTotal + (teamScore.totalScore || 0));
            });
          }
        });
      }
      
      // Add total scores to team objects
      tournament.teams.forEach(team => {
        const totalScore = teamTotalScores.get(team._id.toString()) || 0;
        // Make sure the property is added to the actual object
        team.totalScore = totalScore;
        team.set('totalScore', totalScore); // For Mongoose documents
      });
      
      // Sort teams by total score in descending order (highest score first)
      tournament.teams.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      
      // Add rank numbers to each team
      tournament.teams.forEach((team, index) => {
        const rank = index + 1;
        team.rank = rank;
        team.set('rank', rank); // For Mongoose documents
      });
    }

    // Convert to plain object to ensure custom properties are included
    const plainTournament = tournament.toObject();
    
    // Re-add the calculated properties to the plain object
    if (plainTournament.teams && tournament.teams) {
      plainTournament.teams.forEach((team, index) => {
        team.totalScore = tournament.teams[index].totalScore;
        team.rank = tournament.teams[index].rank;
      });
    }

    return plainTournament;
  } catch (error) {
    throw new Error(`Error finding tournament: ${error.message}`);
  }
}

  async update(id, updateData) {
    try {
      const tournament = await this.model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return tournament;
    } catch (error) {
      throw new Error(`Error updating tournament: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const tournament = await this.model.findByIdAndDelete(id);
      
      if (tournament) {
        // Optionally clean up related teams and players
        await this.teamModel.deleteMany({ _id: { $in: tournament.teams } });
        await this.playerModel.deleteMany({ _id: { $in: tournament.players } });
      }

      return tournament;
    } catch (error) {
      throw new Error(`Error deleting tournament: ${error.message}`);
    }
  }

  // Method to get tournament statistics
  async getTournamentStats(tournamentId) {
    try {
      const tournament = await this.model.findById(tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const stats = {
        tournamentInfo: {
          name: tournament.name,
          status: tournament.status,
          currentRound: tournament.currentRoundNumber,
          totalTeams: tournament.teams.length,
          totalPlayers: tournament.players.length,
          totalGames: tournament.selectedGames.length
        },
        gameProgress: {
          completedGames: tournament.leaderboard.gameLeaderboards.filter(gl => gl.status === 'completed').length,
          inProgressGames: tournament.leaderboard.gameLeaderboards.filter(gl => gl.status === 'in_progress').length,
          pendingGames: tournament.leaderboard.gameLeaderboards.filter(gl => gl.status === 'pending').length
        },
        leaderboardSummary: {
          topTeam: tournament.leaderboard.overallTeamRankings[0] || null,
          topPlayer: tournament.leaderboard.overallPlayerRankings[0] || null,
          winner: tournament.leaderboard.winner,
          lastUpdated: tournament.leaderboard.lastUpdated
        }
      };

      return stats;
    } catch (error) {
      throw new Error(`Error getting tournament stats: ${error.message}`);
    }
  }
}

export default TournamentRepository;