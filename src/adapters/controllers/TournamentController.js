import AnimalRepository from '../../infrastructure/repositories/AnimalRepository.js';
import GameRepository from '../../infrastructure/repositories/gameRepository.js';
import TournamentRepository from '../../infrastructure/repositories/TournamentRepository.js';

class TournamentController {
  constructor() {
    this.animalRepository = new AnimalRepository();
    this.gameRepository = new GameRepository();
    this.tournamentRepository = new TournamentRepository();
  }

  // ===== TOURNAMENT MANAGEMENT METHODS =====

  async createTournament(req, res) {
    try {
      const payload = req.body;

      // Validate tournament data
      if (!payload.tournament?.name) {
        return res.status(400).json({
          success: false,
          message: 'Tournament name is required'
        });
      }

      // Validate teams data
      if (!Array.isArray(payload.teams) || payload.teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one team is required'
        });
      }

      // Validate that teams have players
      const hasPlayersInTeams = payload.teams.every(team => 
        Array.isArray(team.players) && team.players.length > 0
      );

      if (!hasPlayersInTeams) {
        return res.status(400).json({
          success: false,
          message: 'Each team must have at least one player'
        });
      }

      const newTournament = await this.tournamentRepository.createTournament(payload);

      res.status(201).json({
        success: true,
        message: 'Tournament created successfully',
        data: newTournament
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create tournament',
        error: error.message
      });
    }
  }

  async getAllTournaments(req, res) {
    try {
      const { status, limit, page } = req.query;
      const tournaments = await this.tournamentRepository.findAll({
        status,
        limit: limit ? parseInt(limit) : undefined,
        page: page ? parseInt(page) : undefined
      });

      res.status(200).json({
        success: true,
        count: tournaments.length,
        data: tournaments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get tournaments',
        error: error.message
      });
    }
  }

  async getTournamentById(req, res) {
    try {
      const { id } = req.params;
      const tournament = await this.tournamentRepository.findById(id);

      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: `Tournament with ID '${id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        data: tournament
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get tournament',
        error: error.message
      });
    }
  }

  async updateTournament(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedTournament = await this.tournamentRepository.update(id, updateData);

      if (!updatedTournament) {
        return res.status(404).json({
          success: false,
          message: `Tournament with ID '${id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tournament updated successfully',
        data: updatedTournament
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update tournament',
        error: error.message
      });
    }
  }

  async deleteTournament(req, res) {
    try {
      const { id } = req.params;
      const deletedTournament = await this.tournamentRepository.delete(id);

      if (!deletedTournament) {
        return res.status(404).json({
          success: false,
          message: `Tournament with ID '${id}' not found`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tournament deleted successfully',
        data: deletedTournament
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete tournament',
        error: error.message
      });
    }
  }

  async addTeamToTournament(req, res) {
    try {
      const { tournamentId } = req.params;
      const { teamId } = req.body;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID is required'
        });
      }

      const tournament = await this.tournamentRepository.addTeam(tournamentId, teamId);

      res.status(200).json({
        success: true,
        message: 'Team added to tournament',
        data: tournament
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add team to tournament',
        error: error.message
      });
    }
  }

  // Add these methods to your TournamentController class

// ===== TEAM MANAGEMENT METHODS =====

/**
 * Add a new team with players to an existing tournament
 * POST /tournaments/:tournamentId/teams
 */
async addNewTeamToTournament(req, res) {
  try {
    const { tournamentId } = req.params;
    const teamData = req.body;

    // Validate team data
    if (!teamData.name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    if (!Array.isArray(teamData.players) || teamData.players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one player is required for the team'
      });
    }

    // Validate player data
    const hasValidPlayers = teamData.players.every(player => 
      player.name && (player.avatar || player.animalAvatar)
    );

    if (!hasValidPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Each player must have a name and avatar'
      });
    }

    const tournament = await this.tournamentRepository.addTeamToTournament(tournamentId, teamData);

    res.status(201).json({
      success: true,
      message: 'Team added to tournament successfully',
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add team to tournament',
      error: error.message
    });
  }
}

/**
 * Add existing team to tournament (legacy method)
 * POST /tournaments/:tournamentId/add-team
 */
async addTeamToTournament(req, res) {
  try {
    const { tournamentId } = req.params;
    const { teamName } = req.body;

    if (!teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    const tournament = await this.tournamentRepository.addTeam(tournamentId, teamName);

    res.status(200).json({
      success: true,
      message: 'Team added to tournament',
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add team to tournament',
      error: error.message
    });
  }
}

/**
 * Remove a team from tournament
 * DELETE /tournaments/:tournamentId/teams/:teamId
 */
async removeTeamFromTournament(req, res) {
  try {
    const { tournamentId, teamId } = req.params;

    const tournament = await this.tournamentRepository.removeTeamFromTournament(tournamentId, teamId);

    res.status(200).json({
      success: true,
      message: 'Team removed from tournament successfully',
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove team from tournament',
      error: error.message
    });
  }
}

/**
 * Update team information
 * PUT /tournaments/:tournamentId/teams/:teamId
 */
async updateTeam(req, res) {
  try {
    const { teamId } = req.params;
    const updateData = req.body;

    const updatedTeam = await this.tournamentRepository.updateTeam(teamId, updateData);

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update team',
      error: error.message
    });
  }
}

/**
 * Get team details with players
 * GET /tournaments/:tournamentId/teams/:teamId
 */
async getTeamWithPlayers(req, res) {
  try {
    const { teamId } = req.params;

    const team = await this.tournamentRepository.getTeamWithPlayers(teamId);

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get team details',
      error: error.message
    });
  }
}

// ===== PLAYER MANAGEMENT METHODS =====

/**
 * Add a player to an existing team
 * POST /tournaments/:tournamentId/teams/:teamId/players
 */
async addPlayerToTeam(req, res) {
  try {
    const { tournamentId, teamId } = req.params;
    const playerData = req.body;

    // Validate player data
    if (!playerData.name) {
      return res.status(400).json({
        success: false,
        message: 'Player name is required'
      });
    }

    if (!playerData.avatar && !playerData.animalAvatar) {
      return res.status(400).json({
        success: false,
        message: 'Player avatar is required'
      });
    }

    const team = await this.tournamentRepository.addPlayerToTeam(tournamentId, teamId, playerData);

    res.status(201).json({
      success: true,
      message: 'Player added to team successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add player to team',
      error: error.message
    });
  }
}

/**
 * Remove a player from a team
 * DELETE /tournaments/:tournamentId/teams/:teamId/players/:playerId
 */
async removePlayerFromTeam(req, res) {
  try {
    const { tournamentId, teamId, playerId } = req.params;

    const team = await this.tournamentRepository.removePlayerFromTeam(tournamentId, teamId, playerId);

    res.status(200).json({
      success: true,
      message: 'Player removed from team successfully',
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove player from team',
      error: error.message
    });
  }
}

/**
 * Update player information
 * PUT /tournaments/:tournamentId/teams/:teamId/players/:playerId
 */
async updatePlayer(req, res) {
  try {
    const { playerId } = req.params;
    const updateData = req.body;

    const updatedPlayer = await this.tournamentRepository.updatePlayer(playerId, updateData);

    res.status(200).json({
      success: true,
      message: 'Player updated successfully',
      data: updatedPlayer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update player',
      error: error.message
    });
  }
}

/**
 * Move a player from one team to another
 * PUT /tournaments/:tournamentId/players/:playerId/move
 */
async movePlayerBetweenTeams(req, res) {
  try {
    const { tournamentId, playerId } = req.params;
    const { fromTeamId, toTeamId } = req.body;

    if (!fromTeamId || !toTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Both fromTeamId and toTeamId are required'
      });
    }

    if (fromTeamId === toTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination teams cannot be the same'
      });
    }

    const result = await this.tournamentRepository.movePlayerBetweenTeams(
      tournamentId, 
      playerId, 
      fromTeamId, 
      toTeamId
    );

    res.status(200).json({
      success: true,
      message: 'Player moved between teams successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to move player between teams',
      error: error.message
    });
  }
}

// ===== TOURNAMENT STATUS MANAGEMENT =====

/**
 * Update tournament status
 * PUT /tournaments/:tournamentId/status
 */
async updateTournamentStatus(req, res) {
  try {
    const { tournamentId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined || isActive === null) {
      return res.status(400).json({
        success: false,
        message: 'isActive is required'
      });
    }

    // Validate isActive is boolean
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value (true or false)'
      });
    }

    const tournament = await this.tournamentRepository.updateTournamentStatus(tournamentId, isActive);

    res.status(200).json({
      success: true,
      message: `Tournament ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update tournament status',
      error: error.message
    });
  }
}

/**
 * Get tournament statistics
 * GET /tournaments/:tournamentId/stats
 */
  async getTournamentStats(req, res) {
    try {
      const { tournamentId } = req.params;

      const stats = await this.tournamentRepository.getTournamentStats(tournamentId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get tournament statistics',
        error: error.message
      });
    }
  }

  async getLeaderboardForTournament(req, res) {
    try {
      // Your repository method doesn't use tournamentId, it finds active tournament
      const leaderboardData = await this.tournamentRepository.getLeaderboardForTournament();

      // Check if tournament exists (your repo returns null when no active tournament)
      if (!leaderboardData) {
        return res.status(404).json({
          success: false,
          message: 'No active tournament found'
        });
      }

      res.status(200).json({
        success: true,
        data: leaderboardData
      });
    } catch (error) {
      // Handle specific database errors
      if (error.message.includes('Tournament not found') || 
          error.message.includes('Invalid tournament ID')) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Handle other errors
      res.status(500).json({
        success: false,
        message: 'Failed to get tournament leaderboard',
        error: error.message
      });
    }
  }
}

export default TournamentController;