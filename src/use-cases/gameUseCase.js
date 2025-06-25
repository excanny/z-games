class GameUseCase {
    constructor(gameRepository) {
      this.gameRepository = gameRepository;
    }
  
    async createGame({ name, gameType, participants }) {
      // Validate participants array contains objects with name, avatar, color
      if (!Array.isArray(participants) || participants.some(p => !p.name || !p.avatar || !p.color)) {
        throw new Error("Invalid participants data");
      }
  
      // Deactivate all games first
      await this.gameRepository.deactivateAllGames();
  
      // Create new game and set active
      return await this.gameRepository.createGame({ name, gameType, participants, isActive: true });
    }
  
    async getGameById(id) {
      return await this.gameRepository.getGameById(id);
    }

    async getGameByGameCode(gameCode) {
      return await this.gameRepository.getGameByGameCode(gameCode);
    }
  
    async getAllGames() {
      return await this.gameRepository.getAllGames();
    }
  
    async updateGame(id, gameData, io) {
      return await this.gameRepository.updateGame(id, gameData, io);
    }
  
    async getActiveGame() {
      return await this.gameRepository.getActiveGame();
    }
  
    /**
     * Update participant's score by a delta, logs the update internally.
     * This delegates to GameRepository for proper logging.
     * @param {String} gameId
     * @param {String} participantName
     * @param {Number} scoreDelta (can be positive or negative)
     */
    async updateParticipantScore(gameId, participantName, scoreDelta, io) {
      // Delegate to repository which updates score and logs event
      return await this.gameRepository.updatePlayerScore(gameId, participantName, scoreDelta, io);
    }
  
    async getLeaderboardForGame(gameId) {
      // Now delegate to the repository which includes longest streak
      return await this.gameRepository.getLeaderboardForGame(gameId);
    }
  }
  
  export default GameUseCase;