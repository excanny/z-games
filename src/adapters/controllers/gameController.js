class GameController {
  constructor(gameUseCase) {
    this.gameUseCase = gameUseCase;
  }

  async createGame(req, res) {
    try {
      const game = await this.gameUseCase.createGame(req.body);
      return res.status(201).json({
        status: "success",
        message: "Game created successfully",
        data: game,
      });
    } catch (error) {
      console.error("Game Creation Error:", error);
      return res.status(500).json({
        status: "error",
        message: "An unexpected error occurred",
        data: error.message || error,
      });
    }
  }

  async getGameById(req, res) {
    try {
      const { id } = req.params;
      const game = await this.gameUseCase.getGameById(id);

      return res.status(200).json({
        status: "success",
        message: "Game retrieved successfully",
        data: game,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "An unexpected error occurred",
        data: error.message || error,
      });
    }
  }

  async getGameByGameCode(req, res) {
    try {
      const { gameCode } = req.params;
      const game = await this.gameUseCase.getGameByGameCode(gameCode);

      if (!game) {
        return res.status(404).json({
          status: "error",
          message: "Game not found",
          data: null,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Game retrieved successfully",
        data: game,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "An unexpected error occurred",
        data: error.message || error,
      });
    }
  }

  async getAllGames(req, res) {
    try {
      const games = await this.gameUseCase.getAllGames();
      return res.status(200).json({
        status: "success",
        message: "Games retrieved successfully",
        data: games,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to retrieve games",
        data: error.message || error,
      });
    }
  }

  async updateGame(req, res) {
    try {
      const { id } = req.params;
      const gameData = req.body;
      const io = req.app.get('io');

      const updatedGame = await this.gameUseCase.updateGame(id, gameData, io);

      return res.status(200).json({
        status: "success",
        message: "Game updated successfully",
        data: updatedGame,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "An unexpected error occurred",
        data: error.message || error,
      });
    }
  }

  async getActiveGame(req, res) {
    try {
      const activeGame = await this.gameUseCase.getActiveGame();

      return res.status(200).json({
        status: "success",
        message: "Active game retrieved successfully",
        data: activeGame,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Failed to retrieve active game",
        data: error.message || error,
      });
    }
  }

  /**
   * Add a new player to a game
   * POST /games/:gameId/players
   * Body: { name, avatar?, color? }
   */
  async addPlayer(req, res) {
    try {
      const { gameId } = req.params;
      const playerData = req.body;
      const io = req.app.get('io');

      const addedPlayer = await this.gameUseCase.addPlayerToGame(gameId, playerData, io);

      return res.status(201).json({
        status: "success",
        message: "Player added successfully",
        data: addedPlayer,
      });
    } catch (error) {
      const statusCode = error.message.includes("already exists") ? 409 : 
                        error.message.includes("not found") ? 404 : 400;
      
      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Add multiple players to a game in bulk
   * POST /games/:gameId/players/bulk-add
   * Body: { players: [{ name, avatar?, color? }, ...] }
   */
  async addBulkPlayers(req, res) {
    try {
      const { gameId } = req.params;
      const { players } = req.body;
      const io = req.app.get('io');

      if (!Array.isArray(players) || players.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Players array is required and cannot be empty",
          data: null,
        });
      }

      const results = await this.gameUseCase.addBulkPlayersToGame(gameId, players, io);

      // Determine status code based on results
      let statusCode = 200;
      let status = "success";
      let message = "All players added successfully";

      if (results.failed.length > 0) {
        if (results.added.length === 0 && results.reactivated.length === 0) {
          // All failed
          statusCode = 400;
          status = "error";
          message = "Failed to add any players";
        } else {
          // Partial success
          statusCode = 207; // Multi-Status
          status = "partial_success";
          message = "Some players were added successfully";
        }
      }

      return res.status(statusCode).json({
        status,
        message,
        data: {
          summary: {
            totalProcessed: results.totalProcessed,
            added: results.added.length,
            reactivated: results.reactivated.length,
            failed: results.failed.length
          },
          results: {
            added: results.added,
            reactivated: results.reactivated,
            failed: results.failed
          }
        },
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      
      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Remove a player from a game
   * DELETE /games/:gameId/players/:playerName
   */
  async removePlayer(req, res) {
    try {
      const { gameId, playerName } = req.params;
      const io = req.app.get('io');

      const removedPlayer = await this.gameUseCase.removePlayerFromGame(gameId, playerName, io);

      return res.status(200).json({
        status: "success",
        message: "Player removed successfully",
        data: removedPlayer,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 
                        error.message.includes("already inactive") ? 400 : 500;

      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Reactivate a previously removed player
   * PUT /games/:gameId/players/:playerName/reactivate
   */
  async reactivatePlayer(req, res) {
    try {
      const { gameId, playerName } = req.params;
      const io = req.app.get('io');

      const reactivatedPlayer = await this.gameUseCase.reactivatePlayer(gameId, playerName, io);

      return res.status(200).json({
        status: "success",
        message: "Player reactivated successfully",
        data: reactivatedPlayer,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 
                        error.message.includes("already active") ? 400 : 500;

      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Get all participants for a game
   * GET /games/:gameId/participants
   * Query params: ?status=active|inactive|all (default: all)
   */
  async getParticipants(req, res) {
    try {
      const { gameId } = req.params;
      const { status = 'all' } = req.query;

      let participants;

      switch (status.toLowerCase()) {
        case 'active':
          participants = await this.gameUseCase.getActiveParticipants(gameId);
          break;
        case 'inactive':
          participants = await this.gameUseCase.getInactiveParticipants(gameId);
          break;
        case 'all':
        default:
          participants = await this.gameUseCase.getAllParticipants(gameId);
          break;
      }

      return res.status(200).json({
        status: "success",
        message: `${status.charAt(0).toUpperCase() + status.slice(1)} participants retrieved successfully`,
        data: participants,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 500;

      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Get a specific participant
   * GET /games/:gameId/participants/:playerName
   */
  async getParticipant(req, res) {
    try {
      const { gameId, playerName } = req.params;

      const participant = await this.gameUseCase.findParticipant(gameId, playerName);

      if (!participant) {
        return res.status(404).json({
          status: "error",
          message: "Participant not found",
          data: null,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Participant retrieved successfully",
        data: participant,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Get game statistics
   * GET /games/:gameId/stats
   */
  async getGameStats(req, res) {
    try {
      const { gameId } = req.params;

      const stats = await this.gameUseCase.getGameStats(gameId);

      return res.status(200).json({
        status: "success",
        message: "Game statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 500;

      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Get player with longest streak
   * GET /games/:gameId/longest-streak
   */
  async getLongestStreak(req, res) {
    try {
      const { gameId } = req.params;

      const longestStreak = await this.gameUseCase.getPlayerWithLongestStreak(gameId);

      return res.status(200).json({
        status: "success",
        message: "Longest streak retrieved successfully",
        data: longestStreak,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 500;

      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  async updateParticipantScore(req, res) {
    try {
      const { gameId } = req.params;
      const { name, scoreDelta } = req.body; // Use scoreDelta to indicate change amount
      const io = req.app.get('io');  // Access io globally

      if (typeof scoreDelta !== "number") {
        throw new Error("scoreDelta must be a number");
      }

      const updatedParticipant = await this.gameUseCase.updateParticipantScore(
        gameId,
        name,
        scoreDelta,
        io
      );

      return res.status(200).json({
        status: "success",
        message: "Participant score updated successfully",
        data: updatedParticipant,
      });
    } catch (error) {
      const statusCode = error.message.includes("not found") ? 404 : 
                        error.message.includes("inactive") ? 400 : 400;

      return res.status(statusCode).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  async getLeaderboard(req, res) {
    try {
      const { id } = req.params;
      const result = await this.gameUseCase.getLeaderboardForGame(id);

      return res.status(200).json({
        status: "success",
        message: "Leaderboard retrieved successfully",
        data: result,
      });
    } catch (error) {
      return res.status(404).json({
        status: "error",
        message: error.message || "Failed to retrieve leaderboard",
      });
    }
  }

  /**
   * Generic bulk player operations (legacy support)
   * POST /games/:gameId/players/bulk
   * Body: { 
   *   action: 'add' | 'remove' | 'reactivate',
   *   players: [{ name, avatar?, color? }] | ['playerName1', 'playerName2']
   * }
   */
  async bulkPlayerOperations(req, res) {
    try {
      const { gameId } = req.params;
      const { action, players } = req.body;
      const io = req.app.get('io');

      if (!action || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Action and players array are required",
          data: null,
        });
      }

      // For 'add' action, delegate to the new bulk add method
      if (action === 'add') {
        // Transform players data if needed and call the dedicated bulk add
        const playersData = players.map(player => 
          typeof player === 'string' ? { name: player } : player
        );
        
        req.body = { players: playersData };
        return await this.addBulkPlayers(req, res);
      }

      // Handle other bulk operations individually
      const results = [];
      const errors = [];

      for (const player of players) {
        try {
          let result;
          switch (action) {
            case 'remove':
              const playerName = typeof player === 'string' ? player : player.name;
              result = await this.gameUseCase.removePlayerFromGame(gameId, playerName, io);
              break;
            case 'reactivate':
              const reactivatePlayerName = typeof player === 'string' ? player : player.name;
              result = await this.gameUseCase.reactivatePlayer(gameId, reactivatePlayerName, io);
              break;
            default:
              throw new Error(`Invalid action: ${action}`);
          }
          results.push({ success: true, player: result });
        } catch (error) {
          const playerIdentifier = typeof player === 'string' ? player : player.name || 'unknown';
          errors.push({ 
            success: false, 
            player: playerIdentifier, 
            error: error.message 
          });
        }
      }

      const statusCode = errors.length === 0 ? 200 : 
                        results.length === 0 ? 400 : 207; // 207 = Multi-Status

      return res.status(statusCode).json({
        status: errors.length === 0 ? "success" : "partial_success",
        message: `Bulk ${action} operation completed`,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: players.length,
            successful: results.length,
            failed: errors.length
          }
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }

  /**
   * Validate bulk player data
   * POST /games/:gameId/players/validate
   * Body: { players: [{ name, avatar?, color? }, ...] }
   */
  async validateBulkPlayerData(req, res) {
    try {
      const { players } = req.body;

      if (!Array.isArray(players)) {
        return res.status(400).json({
          status: "error",
          message: "Players array is required",
          data: null,
        });
      }

      const validation = this.gameUseCase.validateBulkPlayerData(players);

      return res.status(200).json({
        status: "success",
        message: "Validation completed",
        data: {
          summary: {
            total: players.length,
            valid: validation.valid.length,
            invalid: validation.invalid.length,
            hasErrors: validation.hasErrors
          },
          valid: validation.valid,
          invalid: validation.invalid
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
        data: null,
      });
    }
  }
}

export default GameController;