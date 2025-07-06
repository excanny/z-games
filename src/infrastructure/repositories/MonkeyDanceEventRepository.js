class MonkeyDanceEventRepository extends BaseRepository {
  constructor() {
    super(MonkeyDanceEvent);
  }

  async findBySession(sessionId) {
    try {
      return await this.model.find({ gameSession: sessionId })
        .populate('triggeredBy', 'name')
        .populate('victims.player', 'name')
        .sort({ triggeredAt: -1 });
    } catch (error) {
      throw new Error(`Error finding monkey dance events by session: ${error.message}`);
    }
  }

  async findByMonkey(monkeyPlayerId) {
    try {
      return await this.model.find({ triggeredBy: monkeyPlayerId })
        .populate('victims.player', 'name')
        .sort({ triggeredAt: -1 });
    } catch (error) {
      throw new Error(`Error finding monkey dance events by monkey: ${error.message}`);
    }
  }

  async createEvent(sessionId, monkeyPlayerId, victims, song = null) {
    try {
      const event = new this.model({
        gameSession: sessionId,
        triggeredBy: monkeyPlayerId,
        victims: victims.map(victim => ({
          player: victim.playerId,
          pointsStolen: victim.pointsStolen || 5
        })),
        song: song,
        triggeredAt: new Date()
      });

      return await event.save();
    } catch (error) {
      throw new Error(`Error creating monkey dance event: ${error.message}`);
    }
  }

  async getTotalPointsStolen(monkeyPlayerId, sessionId = null) {
    try {
      const filter = { triggeredBy: monkeyPlayerId };
      if (sessionId) filter.gameSession = sessionId;

      const events = await this.model.find(filter);
      return events.reduce((total, event) => {
        return total + event.victims.reduce((eventTotal, victim) => {
          return eventTotal + victim.pointsStolen;
        }, 0);
      }, 0);
    } catch (error) {
      throw new Error(`Error getting total points stolen: ${error.message}`);
    }
  }
}

// Export the MonkeyDanceEventRepository class
export default MonkeyDanceEventRepository;