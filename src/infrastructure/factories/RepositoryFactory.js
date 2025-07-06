class RepositoryFactory {
  static repositories = {};

  static getRepository(type) {
    if (!this.repositories[type]) {
      switch (type) {
        case 'animal':
          this.repositories[type] = new AnimalRepository();
          break;
        case 'player':
          this.repositories[type] = new PlayerRepository();
          break;
        case 'game':
          this.repositories[type] = new GameRepository();
          break;
        case 'gameSession':
          this.repositories[type] = new GameSessionRepository();
          break;
        case 'gameRound':
          this.repositories[type] = new GameRoundRepository();
          break;
        case 'monkeyDanceEvent':
          this.repositories[type] = new MonkeyDanceEventRepository();
          break;
        case 'prize':
          this.repositories[type] = new PrizeRepository();
          break;
        default:
          throw new Error(`Unknown repository type: ${type}`);
      }
    }
    return this.repositories[type];
  }

  static getAllRepositories() {
    return {
      animal: this.getRepository('animal'),
      player: this.getRepository('player'),
      game: this.getRepository('game'),
      gameSession: this.getRepository('gameSession'),
      gameRound: this.getRepository('gameRound'),
      monkeyDanceEvent: this.getRepository('monkeyDanceEvent'),
      prize: this.getRepository('prize')
    };
  }
}