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

 async addTeam(tournamentId, teamName) {
  try {
    const tournament = await this.model.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    // Check if team already exists in tournament
    const existingTeam = await this.teamModel.findOne({ 
      name: teamName,
      _id: { $in: tournament.teams }
    });
    
    if (existingTeam) {
      throw new Error('Team already exists in this tournament');
    }

    // Create new team with empty players array
    const newTeam = await this.teamModel.create({
      name: teamName,
      players: [], // Empty initially
      totalPoints: 0,
      isActive: true,
      // Add any other team fields your Team model requires
    });

    // Add team to tournament
    tournament.teams.push(newTeam._id);
    await tournament.save();

    // Return updated tournament with populated teams
    const updatedTournament = await this.model.findById(tournamentId).populate('teams');
    return updatedTournament;
    
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

  // Add these methods to your TournamentRepository class

/**
 * Add a new team to an existing tournament
 * @param {string} tournamentId - The tournament ID
 * @param {Object} teamData - Team data with players
 * @returns {Promise<Object>} Updated tournament
 */
async addTeamToTournament(tournamentId, teamData) {
  try {
    const tournament = await this.model.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    // Check if tournament allows adding teams (e.g., not completed)
    if (tournament.status === 'completed') {
      throw new Error('Cannot add teams to a completed tournament');
    }

    // Create the new team
    const newTeam = await this.teamModel.create({
      name: teamData.name,
      players: [], // Will be populated with player ObjectIds
      totalPoints: 0,
      isActive: true,
    });

    // Create players for this team
    const teamPlayerIds = [];
    
    for (const player of teamData.players) {
      // Find animal by name (map emoji to animal name if needed)
      let animalName = this.mapEmojiToAnimalName(player.avatar || player.animalAvatar);
      let animal = await this.animalModel.findOne({ name: animalName });
      
      if (!animal) {
        throw new Error(`Animal not found for: ${animalName}`);
      }
      
      // Create standalone Player document
      const newPlayer = await this.playerModel.create({
        name: player.name,
        animalAvatar: animal._id,
        teamId: newTeam._id,
        score: 0,
        contributionPercentage: 0,
      });
      
      teamPlayerIds.push(newPlayer._id);
      tournament.players.push(newPlayer._id);
    }
    
    // Update team with player references
    newTeam.players = teamPlayerIds;
    await newTeam.save();

    // Add team to tournament
    tournament.teams.push(newTeam._id);
    await tournament.save();

    return tournament;
  } catch (error) {
    throw new Error(`Error adding team to tournament: ${error.message}`);
  }
}

/**
 * Add a new player to an existing team
 * @param {string} tournamentId - The tournament ID
 * @param {string} teamId - The team ID
 * @param {Object} playerData - Player data
 * @returns {Promise<Object>} Updated team
 */
async addPlayerToTeam(tournamentId, teamId, playerData) {
  try {
    const tournament = await this.model.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const team = await this.teamModel.findById(teamId);
    if (!team) throw new Error('Team not found');

    // Check if team belongs to tournament
    if (!tournament.teams.includes(teamId)) {
      throw new Error('Team does not belong to this tournament');
    }

    // Check max players per team limit
    if (tournament.settings.maxPlayersPerTeam && 
        team.players.length >= tournament.settings.maxPlayersPerTeam) {
      throw new Error(`Team already has maximum number of players (${tournament.settings.maxPlayersPerTeam})`);
    }

    // Find animal by name (map emoji to animal name if needed)
    let animalName = this.mapEmojiToAnimalName(playerData.avatar || playerData.animalAvatar);
    let animal = await this.animalModel.findOne({ name: animalName });
    
    if (!animal) {
      throw new Error(`Animal not found for: ${animalName}`);
    }

    // Create new player
    const newPlayer = await this.playerModel.create({
      name: playerData.name,
      animalAvatar: animal._id,
      teamId: teamId,
      score: 0,
      contributionPercentage: 0,
    });

    // Add player to team
    team.players.push(newPlayer._id);
    await team.save();

    // Add player to tournament
    tournament.players.push(newPlayer._id);
    await tournament.save();

    return team;
  } catch (error) {
    throw new Error(`Error adding player to team: ${error.message}`);
  }
}

/**
 * Remove a player from a team
 * @param {string} tournamentId - The tournament ID
 * @param {string} teamId - The team ID
 * @param {string} playerId - The player ID to remove
 * @returns {Promise<Object>} Updated team
 */
async removePlayerFromTeam(tournamentId, teamId, playerId) {
  try {
    const tournament = await this.model.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const team = await this.teamModel.findById(teamId);
    if (!team) throw new Error('Team not found');

    const player = await this.playerModel.findById(playerId);
    if (!player) throw new Error('Player not found');

    // Check if team belongs to tournament
    if (!tournament.teams.includes(teamId)) {
      throw new Error('Team does not belong to this tournament');
    }

    // Check if player belongs to team
    if (!team.players.includes(playerId)) {
      throw new Error('Player does not belong to this team');
    }

    // Remove player from team
    team.players = team.players.filter(id => id.toString() !== playerId);
    await team.save();

    // Remove player from tournament
    tournament.players = tournament.players.filter(id => id.toString() !== playerId);
    await tournament.save();

    // Delete the player document
    await this.playerModel.findByIdAndDelete(playerId);

    return team;
  } catch (error) {
    throw new Error(`Error removing player from team: ${error.message}`);
  }
}

/**
 * Remove a team from tournament
 * @param {string} tournamentId - The tournament ID
 * @param {string} teamId - The team ID to remove
 * @returns {Promise<Object>} Updated tournament
 */
async removeTeamFromTournament(tournamentId, teamId) {
  try {
    const tournament = await this.model.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const team = await this.teamModel.findById(teamId);
    if (!team) throw new Error('Team not found');

    // Check if team belongs to tournament
    if (!tournament.teams.includes(teamId)) {
      throw new Error('Team does not belong to this tournament');
    }

    // Check if tournament allows removing teams
    if (tournament.status === 'completed') {
      throw new Error('Cannot remove teams from a completed tournament');
    }

    // Remove all players from the team first
    for (const playerId of team.players) {
      tournament.players = tournament.players.filter(id => id.toString() !== playerId.toString());
      await this.playerModel.findByIdAndDelete(playerId);
    }

    // Remove team from tournament
    tournament.teams = tournament.teams.filter(id => id.toString() !== teamId);
    await tournament.save();

    // Delete the team document
    await this.teamModel.findByIdAndDelete(teamId);

    return tournament;
  } catch (error) {
    throw new Error(`Error removing team from tournament: ${error.message}`);
  }
}

/**
 * Update player information
 * @param {string} playerId - The player ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated player
 */
async updatePlayer(playerId, updateData) {
  try {
    const player = await this.playerModel.findById(playerId);
    if (!player) throw new Error('Player not found');

    // Handle avatar/animal update
    if (updateData.avatar || updateData.animalAvatar) {
      const animalName = this.mapEmojiToAnimalName(updateData.avatar || updateData.animalAvatar);
      const animal = await this.animalModel.findOne({ name: animalName });
      
      if (!animal) {
        throw new Error(`Animal not found for: ${animalName}`);
      }
      
      updateData.animalAvatar = animal._id;
      delete updateData.avatar; // Remove avatar field if present
    }

    const updatedPlayer = await this.playerModel.findByIdAndUpdate(
      playerId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedPlayer;
  } catch (error) {
    throw new Error(`Error updating player: ${error.message}`);
  }
}

/**
 * Update team information
 * @param {string} teamId - The team ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated team
 */
async updateTeam(teamId, updateData) {
  try {
    const team = await this.teamModel.findById(teamId);
    if (!team) throw new Error('Team not found');

    const updatedTeam = await this.teamModel.findByIdAndUpdate(
      teamId,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedTeam;
  } catch (error) {
    throw new Error(`Error updating team: ${error.message}`);
  }
}

/**
 * Move a player from one team to another within the same tournament
 * @param {string} tournamentId - The tournament ID
 * @param {string} playerId - The player ID
 * @param {string} fromTeamId - Source team ID
 * @param {string} toTeamId - Destination team ID
 * @returns {Promise<Object>} Result object with both teams
 */
async movePlayerBetweenTeams(tournamentId, playerId, fromTeamId, toTeamId) {
  try {
    const tournament = await this.model.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const fromTeam = await this.teamModel.findById(fromTeamId);
    const toTeam = await this.teamModel.findById(toTeamId);
    const player = await this.playerModel.findById(playerId);

    if (!fromTeam) throw new Error('Source team not found');
    if (!toTeam) throw new Error('Destination team not found');
    if (!player) throw new Error('Player not found');

    // Validate teams belong to tournament
    if (!tournament.teams.includes(fromTeamId) || !tournament.teams.includes(toTeamId)) {
      throw new Error('One or both teams do not belong to this tournament');
    }

    // Check if player belongs to source team
    if (!fromTeam.players.includes(playerId)) {
      throw new Error('Player does not belong to the source team');
    }

    // Check max players per team limit for destination team
    if (tournament.settings.maxPlayersPerTeam && 
        toTeam.players.length >= tournament.settings.maxPlayersPerTeam) {
      throw new Error(`Destination team already has maximum number of players (${tournament.settings.maxPlayersPerTeam})`);
    }

    // Remove player from source team
    fromTeam.players = fromTeam.players.filter(id => id.toString() !== playerId);
    await fromTeam.save();

    // Add player to destination team
    toTeam.players.push(playerId);
    await toTeam.save();

    // Update player's team reference
    player.teamId = toTeamId;
    await player.save();

    return {
      fromTeam,
      toTeam,
      player
    };
  } catch (error) {
    throw new Error(`Error moving player between teams: ${error.message}`);
  }
}

/**
 * Get team details with players
 * @param {string} teamId - The team ID
 * @returns {Promise<Object>} Team with populated players
 */
async getTeamWithPlayers(teamId) {
  try {
    const team = await this.teamModel.findById(teamId)
      .populate({
        path: 'players',
        populate: {
          path: 'animalAvatar',
          model: 'Animal'
        }
      });

    if (!team) throw new Error('Team not found');

    return team;
  } catch (error) {
    throw new Error(`Error getting team with players: ${error.message}`);
  }
}
}

export default TournamentRepository;