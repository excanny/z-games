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
  
        const updatedGame = await this.gameUseCase.updateGame(id, gameData);
  
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
  
    async updateParticipantScore(req, res) {
      try {
        const { gameId } = req.params;
        const { name, scoreDelta } = req.body; // Use scoreDelta to indicate change amount
  
        if (typeof scoreDelta !== "number") {
          throw new Error("scoreDelta must be a number");
        }
  
        const updatedParticipant = await this.gameUseCase.updateParticipantScore(
          gameId,
          name,
          scoreDelta
        );
  
        return res.status(200).json({
          status: "success",
          message: "Participant score updated successfully",
          data: updatedParticipant,
        });
      } catch (err) {
        return res.status(400).json({
          status: "error",
          message: err.message,
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
  }
  
  export default GameController;
  