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
}

export default TournamentController;