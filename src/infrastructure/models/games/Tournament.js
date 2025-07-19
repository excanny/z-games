import mongoose from "mongoose";

const { Schema } = mongoose;

// Player score for a specific game
const gamePlayerScoreSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, required: true, ref: 'Player' },
  teamId: { type: Schema.Types.ObjectId, required: true, ref: 'Team' }, // Added to support the function
  score: { type: Number, default: 0 },
  rank: { type: Number, min: 1 },
  rankWithinTeam: { type: Number, min: 1 }, // Rank within their team
  gameRank: { type: Number, min: 1 }, // Rank within this specific game (added for overall leaderboard)
  performanceRating: { type: Number }, // Added to support the function
  achievements: [{ type: String }], // Added to support the function
  playTime: { type: Number, default: 0 }, // Added to support the function
  completedAt: { type: Date, default: Date.now }
}, { _id: false });

// Team score for a specific game
const gameTeamScoreSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, required: true, ref: 'Team' },
  individualPlayerScore: { type: Number, default: 0 }, // Sum of all player scores
  teamBonusScore: { type: Number, default: 0 }, // Additional team points not attributed to individuals
  totalScore: { type: Number, default: 0 }, // individualPlayerScore + teamBonusScore
  rank: { type: Number, min: 1 },
  gameRank: { type: Number, min: 1 }, // Rank within this specific game (added for overall leaderboard)
  playerScores: [gamePlayerScoreSchema],
  completedAt: { type: Date, default: Date.now }
}, { _id: false });

// Game-specific leaderboard
const gameLeaderboardSchema = new Schema({
  gameId: { type: Schema.Types.ObjectId, required: true, ref: 'Game' },
  gameName: { type: String }, // Added to support the function
  teamScores: [gameTeamScoreSchema],
  playerScores: [gamePlayerScoreSchema], // Added to support the function
  topTeam: { // Added to support the existing method
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    totalScore: { type: Number, default: 0 }
  },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { _id: false });

// Overall team ranking schema (NEW)
const overallTeamRankingSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, required: true, ref: 'Team' },
  totalTeamBonusScore: { type: Number, default: 0 },
  totalIndividualPlayerScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  overallRank: { type: Number, min: 1 },
  gamesPlayed: { type: Number, default: 0 },
  gameBreakdown: [{
    gameId: { type: Schema.Types.ObjectId, required: true, ref: 'Game' },
    teamBonusScore: { type: Number, default: 0 },
    individualPlayerScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    gameRank: { type: Number, min: 1 }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Overall player ranking schema (NEW)
const overallPlayerRankingSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, required: true, ref: 'Player' },
  teamId: { type: Schema.Types.ObjectId, required: true, ref: 'Team' },
  totalScore: { type: Number, default: 0 },
  overallRank: { type: Number, min: 1 },
  gamesPlayed: { type: Number, default: 0 },
  gameBreakdown: [{
    gameId: { type: Schema.Types.ObjectId, required: true, ref: 'Game' },
    score: { type: Number, default: 0 },
    performanceRating: { type: Number },
    gameRank: { type: Number, min: 1 }
  }],
  achievements: [{ type: String }],
  totalPlayTime: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Overall leaderboard schema (NEW)
const overallLeaderboardSchema = new Schema({
  teamRankings: [overallTeamRankingSchema],
  playerRankings: [overallPlayerRankingSchema],
  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

// Game settings schema
const gameSettingsSchema = new Schema({
  enableSuperpowers: { type: Boolean, default: true },
  monkeyDanceEnabled: { type: Boolean, default: true },
  randomPrizeDraws: { type: Boolean, default: true },
}, { _id: false });

// Main Tournament Schema
const tournamentSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now },

  // Selected games for the tournament
  selectedGames: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Game'
  }],

  // Tournament info
  tournamentName: { type: String, trim: true },
  currentGameId: { type: Schema.Types.ObjectId, ref: 'Game' },

  // Team and player references
  teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],

  // Enhanced leaderboard system
  leaderboard: {
    lastUpdated: { type: Date, default: Date.now },
    
    // Game-specific leaderboards
    gameLeaderboards: [gameLeaderboardSchema],
    
    // Overall leaderboard across all games (NEWLY ADDED)
    overallLeaderboard: overallLeaderboardSchema
  },
  isActive: Boolean,
  settings: gameSettingsSchema,
}, { timestamps: true });

// Indexes
tournamentSchema.index({ tournamentId: 1 });
tournamentSchema.index({ players: 1 });
tournamentSchema.index({ teams: 1 });
tournamentSchema.index({ selectedGames: 1 });
tournamentSchema.index({ createdAt: -1 });
tournamentSchema.index({ 'leaderboard.gameLeaderboards.gameId': 1 });
tournamentSchema.index({ 'leaderboard.overallLeaderboard.teamRankings.teamId': 1 }); // NEW INDEX
tournamentSchema.index({ 'leaderboard.overallLeaderboard.playerRankings.playerId': 1 }); // NEW INDEX

// Method to add or update team scores (preserves existing scores)
tournamentSchema.methods.addTeamScore = async function(gameId, teamId, teamBonusScore = 0) {
  // Validate inputs
  if (!gameId || !teamId) {
    throw new Error('gameId and teamId are required');
  }

  const Game = mongoose.model('Game');
  const Team = mongoose.model('Team');
  
  const game = await Game.findById(gameId);
  const team = await Team.findById(teamId);
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  if (!team) {
    throw new Error('Team not found');
  }

  // Find or create game leaderboard
  let gameLeaderboard = this.leaderboard.gameLeaderboards.find(
    gl => gl.gameId.toString() === gameId.toString()
  );

  if (!gameLeaderboard) {
    gameLeaderboard = {
      gameId: gameId,
      gameName: game.name,
      teamScores: [],
      playerScores: [], // Initialize playerScores array
      startedAt: new Date()
    };
    this.leaderboard.gameLeaderboards.push(gameLeaderboard);
  }

  // Find or create team score entry
  let teamScore = gameLeaderboard.teamScores.find(
    ts => ts.teamId.toString() === teamId.toString()
  );

  if (!teamScore) {
    teamScore = {
      teamId: teamId,
      individualPlayerScore: 0,
      teamBonusScore: 0,
      totalScore: 0,
      rank: 1,
      gameRank: 1, // Initialize gameRank
      playerScores: [],
      completedAt: new Date()
    };
    gameLeaderboard.teamScores.push(teamScore);
  }

  // Update team bonus score
  teamScore.teamBonusScore = teamBonusScore;
  teamScore.totalScore = teamScore.individualPlayerScore + teamScore.teamBonusScore;

  await this.updateGameRankings(gameId);
  return this.save();
};

// Method to add or update player scores (preserves existing team scores)
tournamentSchema.methods.addPlayerScore = async function(gameId, playerId, score) {
  // Validate inputs
  if (!gameId || !playerId || score === undefined || score === null) {
    throw new Error('gameId, playerId, and score are required');
  }

  const Game = mongoose.model('Game');
  const Player = mongoose.model('Player');
  
  const game = await Game.findById(gameId);
  const player = await Player.findById(playerId).populate('teamId');
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (!player.teamId) {
    throw new Error('Player is not assigned to a team');
  }

  // Find or create game leaderboard
  let gameLeaderboard = this.leaderboard.gameLeaderboards.find(
    gl => gl.gameId.toString() === gameId.toString()
  );

  if (!gameLeaderboard) {
    gameLeaderboard = {
      gameId: gameId,
      gameName: game.name,
      teamScores: [],
      playerScores: [], // Initialize playerScores array
      startedAt: new Date()
    };
    this.leaderboard.gameLeaderboards.push(gameLeaderboard);
  }

  // Find or create team score entry
  let teamScore = gameLeaderboard.teamScores.find(
    ts => ts.teamId.toString() === player.teamId._id.toString()
  );

  if (!teamScore) {
    teamScore = {
      teamId: player.teamId._id,
      individualPlayerScore: 0,
      teamBonusScore: 0,
      totalScore: 0,
      rank: 1,
      gameRank: 1, // Initialize gameRank
      playerScores: [],
      completedAt: new Date()
    };
    gameLeaderboard.teamScores.push(teamScore);
  }

  // Find or create player score entry in team scores
  let playerScore = teamScore.playerScores.find(
    ps => ps.playerId.toString() === playerId.toString()
  );

  if (!playerScore) {
    playerScore = {
      playerId: playerId,
      teamId: player.teamId._id, // Add teamId
      score: 0,
      rank: 1,
      rankWithinTeam: 1,
      gameRank: 1, // Initialize gameRank
      completedAt: new Date()
    };
    teamScore.playerScores.push(playerScore);
  } else {
    // Update existing player score (subtract old score from team total)
    teamScore.individualPlayerScore -= playerScore.score;
  }

  // Update player score
  playerScore.score = score;
  playerScore.completedAt = new Date();

  // Also add/update player score in game leaderboard's playerScores array
  let gamePlayerScore = gameLeaderboard.playerScores.find(
    ps => ps.playerId.toString() === playerId.toString()
  );

  if (!gamePlayerScore) {
    gamePlayerScore = {
      playerId: playerId,
      teamId: player.teamId._id,
      score: score,
      rank: 1,
      rankWithinTeam: 1,
      gameRank: 1,
      completedAt: new Date()
    };
    gameLeaderboard.playerScores.push(gamePlayerScore);
  } else {
    gamePlayerScore.score = score;
    gamePlayerScore.completedAt = new Date();
  }

  // Recalculate team scores
  teamScore.individualPlayerScore = teamScore.playerScores.reduce((sum, ps) => sum + ps.score, 0);
  teamScore.totalScore = teamScore.individualPlayerScore + teamScore.teamBonusScore;

  await this.updateGameRankings(gameId);
  return this.save();
};

// Method to update rankings for a specific game
tournamentSchema.methods.updateGameRankings = async function(gameId) {
  const gameLeaderboard = this.leaderboard.gameLeaderboards.find(
    gl => gl.gameId.toString() === gameId.toString()
  );

  if (!gameLeaderboard) return;

  // Sort teams by total score (descending)
  gameLeaderboard.teamScores.sort((a, b) => b.totalScore - a.totalScore);

  // Update team ranks
  gameLeaderboard.teamScores.forEach((teamScore, index) => {
    teamScore.rank = index + 1;
    teamScore.gameRank = index + 1; // Set gameRank as well

    // Sort players within each team and update their within-team rankings
    teamScore.playerScores.sort((a, b) => b.score - a.score);
    teamScore.playerScores.forEach((playerScore, playerIndex) => {
      playerScore.rankWithinTeam = playerIndex + 1;
    });
  });

  // Update overall player rankings across all teams
  const allPlayers = gameLeaderboard.teamScores.flatMap(ts => ts.playerScores);
  allPlayers.sort((a, b) => b.score - a.score);
  allPlayers.forEach((playerScore, index) => {
    playerScore.rank = index + 1;
  });

  // Update game leaderboard's playerScores array
  gameLeaderboard.playerScores.sort((a, b) => b.score - a.score);
  gameLeaderboard.playerScores.forEach((playerScore, index) => {
    playerScore.rank = index + 1;
    playerScore.gameRank = index + 1;
  });

  // Set top team
  if (gameLeaderboard.teamScores.length > 0) {
    const topTeam = gameLeaderboard.teamScores[0];
    gameLeaderboard.topTeam = {
      teamId: topTeam.teamId,
      totalScore: topTeam.totalScore
    };
  }

  await this.updateOverallLeaderboard();
};

// Method to update overall leaderboard
tournamentSchema.methods.updateOverallLeaderboard = async function() {
  this.leaderboard.lastUpdated = new Date();
  return this.save();
};

// Method to calculate overall leaderboard (NEW - compatible with your function)
tournamentSchema.methods.calculateOverallLeaderboard = async function() {
  try {
    console.log('Calculating overall leaderboard...');
    
    // Initialize overall leaderboard if it doesn't exist
    if (!this.leaderboard.overallLeaderboard) {
      this.leaderboard.overallLeaderboard = {
        teamRankings: [],
        playerRankings: [],
        lastUpdated: new Date()
      };
    }

    // Create a map to accumulate scores across all games
    const teamTotals = new Map();
    const playerTotals = new Map();

    // STEP 1: Process each game's leaderboard and calculate individual game rankings
    for (const gameLeaderboard of this.leaderboard.gameLeaderboards) {
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
        teamScore.gameRank = index + 1; // Rank within this specific game
      });
      
      // Sort players within this game by their score in this game
      gameLeaderboard.playerScores.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Add game-specific ranking to each player score
      gameLeaderboard.playerScores.forEach((playerScore, index) => {
        playerScore.gameRank = index + 1; // Rank within this specific game
      });
      
      // ACCUMULATE SCORES FOR OVERALL RANKINGS
      // Accumulate team scores across all games
      for (const teamScore of gameLeaderboard.teamScores) {
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
          gameRank: teamScore.gameRank // Include the individual game rank
        });
        teamTotal.lastUpdated = new Date();
      }
      
      // Accumulate player scores across all games
      for (const playerScore of gameLeaderboard.playerScores) {
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
          gameRank: playerScore.gameRank // Include the individual game rank
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
    this.leaderboard.overallLeaderboard = {
      teamRankings: overallTeamRankings,
      playerRankings: overallPlayerRankings,
      lastUpdated: new Date()
    };

    console.log('Overall leaderboard calculated successfully');
    console.log('Team rankings:', overallTeamRankings.length);
    console.log('Player rankings:', overallPlayerRankings.length);
    
    return this.leaderboard.overallLeaderboard;
    
  } catch (error) {
    console.error('Error calculating overall leaderboard:', error);
    throw new Error(`Error calculating overall leaderboard: ${error.message}`);
  }
};

// Method to get detailed leaderboard
tournamentSchema.methods.getDetailedLeaderboard = async function() {
  await this.populate([
    { path: 'selectedGames', select: 'name description category' },
    { path: 'teams', select: 'name' },
    { path: 'players', select: 'name' }
  ]);

  return {
    tournament: {
      id: this._id,
      name: this.name,
      lastUpdated: this.leaderboard.lastUpdated
    },
    gameLeaderboards: this.leaderboard.gameLeaderboards,
    overallLeaderboard: this.leaderboard.overallLeaderboard // Include overall leaderboard
  };
};

export default mongoose.model('Tournament', tournamentSchema);