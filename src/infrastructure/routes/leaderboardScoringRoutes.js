import express from 'express';
import LeaderboardScoringController from '../../adapters/controllers/LeaderboardScoringController.js';
import LeaderboardScoringRepository from '../../infrastructure/repositories/LeaderboardScoringRepository.js';
import LeaderboardRankingRepository from '../../infrastructure/repositories/LeaderboardRankingRepository.js';
import TournamentRepository from '../repositories/TournamentRepository.js';

const router = express.Router();

// Initialize repositories in the correct order
const tournamentRepository = new TournamentRepository();
const leaderboardScoringRepository = new LeaderboardScoringRepository();

// Initialize controller with the scoring repository (assuming this is what the controller needs)
const leaderboardScoringController = new LeaderboardScoringController(leaderboardScoringRepository);

/**
 * @swagger
 * tags:
 *   - name: leaderboardScoring
 *     description: Tournament management and tracking routes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GameSettings:
 *       type: object
 *       properties:
 *         enableSuperpowers:
 *           type: boolean
 *           default: true
 *         monkeyDanceEnabled:
 *           type: boolean
 *           default: true
 *         randomPrizeDraws:
 *           type: boolean
 *           default: true
 *         gameMode:
 *           type: string
 *           enum: [team_vs_team, free_for_all, tournament]
 *           default: team_vs_team
 *         scoringMode:
 *           type: string
 *           enum: [individual, cumulative, average]
 *           default: cumulative
 *         maxRounds:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         timeLimit:
 *           type: integer
 *           default: 600
 *         maxPlayersPerTeam:
 *           type: integer
 *           default: 4
 *           minimum: 1
 *     Tournament:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         tournamentId:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         tournamentName:
 *           type: string
 *         tournamentType:
 *           type: string
 *           enum: [single_elimination, round_robin, swiss, custom]
 *         currentRoundNumber:
 *           type: integer
 *           minimum: 1
 *         currentMatchNumber:
 *           type: integer
 *           minimum: 1
 *         players:
 *           type: array
 *           items:
 *             type: string
 *         teams:
 *           type: array
 *           items:
 *             type: string
 *         gameRounds:
 *           type: array
 *           items:
 *             type: string
 *         currentRound:
 *           type: string
 *         leaderboard:
 *           type: object
 *           properties:
 *             lastUpdated:
 *               type: string
 *               format: date-time
 *             overallTeamRankings:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   teamId:
 *                     type: string
 *                   teamName:
 *                     type: string
 *                   rank:
 *                     type: integer
 *                     minimum: 1
 *                   totalPoints:
 *                     type: number
 *                   averageScore:
 *                     type: number
 *                   gamesPlayed:
 *                     type: integer
 *                   gamesWon:
 *                     type: integer
 *                   playerRankings:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         playerId:
 *                           type: string
 *                         rank:
 *                           type: integer
 *                           minimum: 1
 *                         totalPoints:
 *                           type: number
 *                         averageScore:
 *                           type: number
 *                         contributionPercentage:
 *                           type: number
 *                           minimum: 0
 *                           maximum: 100
 *                         gamesPlayed:
 *                           type: integer
 *                         gamesWon:
 *                           type: integer
 *                         gameBreakdown:
 *                           type: array
 *                           items:
 *                             type: object
 *             overallPlayerRankings:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   playerId:
 *                     type: string
 *                   teamId:
 *                     type: string
 *                   teamName:
 *                     type: string
 *                   rank:
 *                     type: integer
 *                     minimum: 1
 *                   totalPoints:
 *                     type: number
 *                   averageScore:
 *                     type: number
 *                   contributionPercentage:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *                   gamesPlayed:
 *                     type: integer
 *                   gamesWon:
 *                     type: integer
 *                   gameBreakdown:
 *                     type: array
 *                     items:
 *                       type: object
 *             gameLeaderboards:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   gameId:
 *                     type: string
 *                   gameName:
 *                     type: string
 *                   teamScores:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         teamId:
 *                           type: string
 *                         teamName:
 *                           type: string
 *                         totalScore:
 *                           type: number
 *                         averageScore:
 *                           type: number
 *                         rank:
 *                           type: integer
 *                         playerScores:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               playerId:
 *                                 type: string
 *                               score:
 *                                 type: number
 *                               rank:
 *                                 type: integer
 *                               performanceRating:
 *                                 type: number
 *                               achievements:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               playTime:
 *                                 type: number
 *                               completedAt:
 *                                 type: string
 *                                 format: date-time
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                   lastUpdated:
 *                     type: string
 *                     format: date-time
 *             winner:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [team, player]
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 totalPoints:
 *                   type: number
 *         settings:
 *           $ref: '#/components/schemas/GameSettings'
 *         stats:
 *           type: object
 *           properties:
 *             totalPointsScored:
 *               type: number
 *             averagePointsPerRound:
 *               type: number
 *             duration:
 *               type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Player:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1751480107962
 *         name:
 *           type: string
 *           example: "YesMan"
 *         avatar:
 *           type: string
 *           example: "🐯"
 *         avatarName:
 *           type: string
 *           example: "Tiger"
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1751480097009"
 *         name:
 *           type: string
 *           example: "Sabi"
 *         players:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Player'
 *     TournamentData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Test Tournament"
 *         description:
 *           type: string
 *           example: "Test tournament description"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-02T18:15:48.980Z"
 *     CreateTournamentRequest:
 *       type: object
 *       required:
 *         - tournament
 *         - teams
 *       properties:
 *         tournament:
 *           $ref: '#/components/schemas/TournamentData'
 *         teams:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Team'
 *           minItems: 1
 *     TeamScore:
 *       type: object
 *       required:
 *         - teamId
 *         - totalScore
 *       properties:
 *         teamId:
 *           type: string
 *           description: Unique identifier for the team
 *           example: "team001"
 *         teamName:
 *           type: string
 *           description: Display name for the team (optional)
 *           example: "Red Dragons"
 *         totalScore:
 *           type: number
 *           minimum: 0
 *           description: Total score for the team (must be non-negative)
 *           example: 250
 *         playerScores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PlayerScore'
 *           description: Individual player scores within the team (optional)
 *         metadata:
 *           type: object
 *           description: Additional metadata for the team score
 *           additionalProperties: true
 *           example:
 *             teamStrategy: "aggressive"
 *     PlayerScore:
 *       type: object
 *       required:
 *         - playerId
 *         - score
 *       properties:
 *         playerId:
 *           type: string
 *           description: Unique identifier for the player
 *           example: "player001"
 *         playerName:
 *           type: string
 *           description: Display name for the player (optional)
 *           example: "Alice Johnson"
 *         score:
 *           type: number
 *           minimum: 0
 *           description: Score for the player (must be non-negative)
 *           example: 85
 *         teamId:
 *           type: string
 *           description: Team association for the player (optional)
 *           example: "team001"
 *         performanceRating:
 *           type: string
 *           enum: [poor, below_average, average, good, excellent]
 *           default: average
 *           description: Performance rating for the player
 *           example: "excellent"
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of achievements earned by the player
 *           example: ["first_kill", "team_player"]
 *         playTime:
 *           type: number
 *           minimum: 0
 *           description: Time played in seconds
 *           example: 1200
 *         metadata:
 *           type: object
 *           description: Additional metadata for the player score
 *           additionalProperties: true
 *           example:
 *             specialBonus: 10
 *             difficulty: "hard"
 *     GameScoresResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Game scores recorded successfully (team scoring)"
 *         data:
 *           type: object
 *           properties:
 *             tournament:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "tournament789"
 *                 name:
 *                   type: string
 *                   example: "Summer Championship"
 *                 gameId:
 *                   type: string
 *                   example: "game123"
 *             scoreSummary:
 *               oneOf:
 *                 - $ref: '#/components/schemas/TeamScoreSummary'
 *                 - $ref: '#/components/schemas/PlayerScoreSummary'
 *             leaderboard:
 *               type: object
 *               description: Updated tournament leaderboard
 *             recordedAt:
 *               type: string
 *               format: date-time
 *               example: "2024-07-03T14:30:00.000Z"
 *     TeamScoreSummary:
 *       type: object
 *       properties:
 *         scoreType:
 *           type: string
 *           enum: [team]
 *           example: "team"
 *         totalTeams:
 *           type: integer
 *           example: 2
 *         totalPlayers:
 *           type: integer
 *           example: 4
 *         scoreStatistics:
 *           $ref: '#/components/schemas/ScoreStatistics'
 *         teamsWithAdjustments:
 *           type: integer
 *           description: Number of teams with score adjustments (bonus scores)
 *           example: 1
 *         recordedScores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *                 example: "team001"
 *               teamName:
 *                 type: string
 *                 example: "Red Dragons"
 *               totalScore:
 *                 type: number
 *                 example: 250
 *               individualPlayerScore:
 *                 type: number
 *                 description: Sum of individual player scores
 *                 example: 175
 *               teamBonusScore:
 *                 type: number
 *                 description: Team bonus score (totalScore - individualPlayerScore)
 *                 example: 75
 *               playerCount:
 *                 type: integer
 *                 example: 2
 *     PlayerScoreSummary:
 *       type: object
 *       properties:
 *         scoreType:
 *           type: string
 *           enum: [player]
 *           example: "player"
 *         totalPlayers:
 *           type: integer
 *           example: 3
 *         totalTeams:
 *           type: integer
 *           description: Number of teams represented in player scores
 *           example: 2
 *         scoreStatistics:
 *           $ref: '#/components/schemas/ScoreStatistics'
 *         recordedScores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *                 example: "player001"
 *               playerName:
 *                 type: string
 *                 example: "Alice Johnson"
 *               teamId:
 *                 type: string
 *                 example: "team001"
 *               score:
 *                 type: number
 *                 example: 95
 *         teamBreakdown:
 *           type: object
 *           description: Team-level statistics in player scoring mode
 *           additionalProperties:
 *             type: object
 *             properties:
 *               playerCount:
 *                 type: integer
 *               totalScore:
 *                 type: number
 *               averageScore:
 *                 type: number
 *     ScoreStatistics:
 *       type: object
 *       properties:
 *         highest:
 *           type: number
 *           description: Highest score recorded
 *           example: 250
 *         lowest:
 *           type: number
 *           description: Lowest score recorded
 *           example: 180
 *         average:
 *           type: number
 *           description: Average score (rounded to 2 decimal places)
 *           example: 215.67
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Player 1: Player ID is required", "Team 1: Total score must be a number"]
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Tournament not found"
 *         error:
 *           type: string
 *           example: "Database connection failed"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-07-03T14:30:00.000Z"
 */

// ===== LEADERBOARD AND SCORING ROUTES =====

/**
 * @swagger
 * /leaderboardScoring/{tournamentId}/games/{gameId}/scores:
 *   post:
 *     summary: Record game scores for a tournament
 *     tags: [leaderboardScoring]
 *     description: |
 *       Record scores for a specific game in a tournament. This endpoint supports both team-based
 *       and individual player scoring modes. It validates all input data, checks for tournament
 *       and game existence, prevents duplicate IDs, and returns comprehensive score statistics
 *       along with updated leaderboard data.
 *       
 *       **Scoring Modes:**
 *       - **Team Scoring**: Records scores for teams (supports both positive scores and negative deductions)
 *       - **Player Scoring**: Records scores for individual players directly (supports both positive scores and negative deductions)
 *       - **Auto-detection**: Automatically detects scoring mode based on provided data
 *       
 *       **Score Changes:**
 *       - Positive values: Award points (e.g., 100 for game completion)
 *       - Negative values: Deduct points (e.g., -25 for penalties)
 *       - Zero values: Neutral entries (e.g., for tracking without score impact)
 *       
 *       **Validation Rules:**
 *       - Tournament ID and Game ID are required
 *       - Score type must be either "team" or "player" (auto-detected if not provided)
 *       - For team scoring: teamScores array required with teamId and score
 *       - For player scoring: playerScores array required with playerId and score
 *       - No duplicate team IDs or player IDs allowed within the same request
 *       - Game must be part of the tournament's selected games
 *       - teamId in player scoring is optional but recommended for team association
 *       - Reason field is optional but recommended for audit trail
 *       
 *       **Features:**
 *       - Automatic score statistics calculation
 *       - Support for positive scores and negative deductions
 *       - Updated leaderboard generation
 *       - Support for both scoring modes in same tournament
 *       - Idempotency protection against duplicate submissions
 *       - Team association tracking in player scoring mode
 *       - Comprehensive audit trail via reason field
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the tournament
 *         example: "tournament789"
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the game (must be part of tournament's selected games)
 *         example: "game123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scoreType:
 *                 type: string
 *                 enum: [team, player]
 *                 description: |
 *                   Scoring mode for this game. If not provided, will be auto-detected based on
 *                   which scores array is provided (teamScores or playerScores).
 *                 example: "team"
 *               teamScores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [team_id, score]
 *                   properties:
 *                     team_id:
 *                       type: string
 *                       description: Unique identifier of the team
 *                       example: "team-abc123"
 *                     score:
 *                       type: integer
 *                       description: |
 *                         Score change for the team. Can be positive (award points), 
 *                         negative (deduct points), or zero (neutral entry).
 *                       example: 100
 *                     reason:
 *                       type: string
 *                       description: |
 *                         Optional reason for the score change. Useful for audit trail 
 *                         and understanding why points were awarded or deducted.
 *                       maxLength: 255
 *                       example: "Game completion bonus"
 *                   additionalProperties: false
 *                 description: Array of team scores (required for team scoring mode)
 *                 minItems: 1
 *                 example:
 *                   - team_id: "team-abc123"
 *                     score: 100
 *                     reason: "Game completion bonus"
 *                   - team_id: "team-def456"
 *                     score: -25
 *                     reason: "Penalty for rule violation"
 *               playerScores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [player_id, score]
 *                   properties:
 *                     player_id:
 *                       type: string
 *                       description: Unique identifier of the player
 *                       example: "player-xyz789"
 *                     team_id:
 *                       type: string
 *                       description: |
 *                         Optional team identifier for team association. 
 *                         Recommended for proper team leaderboard calculation.
 *                       nullable: true
 *                       example: "team-abc123"
 *                     score:
 *                       type: integer
 *                       description: |
 *                         Score change for the player. Can be positive (award points), 
 *                         negative (deduct points), or zero (neutral entry).
 *                       example: 50
 *                     reason:
 *                       type: string
 *                       description: |
 *                         Optional reason for the score change. Useful for audit trail 
 *                         and understanding why points were awarded or deducted.
 *                       maxLength: 255
 *                       example: "Individual achievement bonus"
 *                   additionalProperties: false
 *                 description: Array of individual player scores (required for player scoring mode)
 *                 minItems: 1
 *                 example:
 *                   - player_id: "player-xyz789"
 *                     team_id: "team-abc123"
 *                     score: 50
 *                     reason: "Individual achievement bonus"
 *                   - player_id: "player-uvw456"
 *                     score: -10
 *                     reason: "Time penalty"
 *             anyOf:
 *               - required: [teamScores]
 *               - required: [playerScores]
 *     responses:
 *       200:
 *         description: Game scores recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Game scores recorded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                       description: Unique request identifier for idempotency tracking
 *                       example: "req-abc123def456"
 *                     tournamentId:
 *                       type: string
 *                       example: "tournament789"
 *                     gameId:
 *                       type: string
 *                       example: "game123"
 *                     scoreType:
 *                       type: string
 *                       enum: [team, player]
 *                       example: "team"
 *                     scoresProcessed:
 *                       type: integer
 *                       description: Number of score entries processed
 *                       example: 2
 *                     totalPointsAwarded:
 *                       type: integer
 *                       description: Sum of all positive score changes
 *                       example: 150
 *                     totalPointsDeducted:
 *                       type: integer
 *                       description: Sum of all negative score changes (absolute value)
 *                       example: 35
 *                     netScoreChange:
 *                       type: integer
 *                       description: Net change in total tournament points
 *                       example: 115
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-19T14:30:00.000Z"
 *       400:
 *         description: Validation failed, invalid input data, or game not part of tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "teamScores[0].score"
 *                       message:
 *                         type: string
 *                         example: "score is required"
 *                       code:
 *                         type: string
 *                         example: "FIELD_REQUIRED"
 *       404:
 *         description: Tournament not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Tournament not found with ID: tournament789"
 *                 code:
 *                   type: string
 *                   example: "TOURNAMENT_NOT_FOUND"
 *       409:
 *         description: Duplicate request (idempotency protection)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Request already processed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                       example: "req-abc123def456"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error recording game scores after 3 attempts: Database connection failed"
 *                 code:
 *                   type: string
 *                   example: "INTERNAL_SERVER_ERROR"
 */
router.post('/:tournamentId/games/:gameId/scores', leaderboardScoringController.recordGameScores.bind(leaderboardScoringController));

/**
 * @swagger
 * /leaderboardScoring/{tournamentId}/leaderboard:
 *   get:
 *     summary: Get tournament leaderboard
 *     tags: [leaderboardScoring]
 *     description: Get the complete leaderboard for a tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: query
 *         name: includeGameDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed game information in the response
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                     overallTeamRankings:
 *                       type: array
 *                       items:
 *                         type: object
 *                     overallPlayerRankings:
 *                       type: array
 *                       items:
 *                         type: object
 *                     gameLeaderboards:
 *                       type: array
 *                       items:
 *                         type: object
 *                     winner:
 *                       type: object
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Server error
 */
router.get('/:tournamentId/leaderboard', leaderboardScoringController.getTournamentLeaderboard.bind(leaderboardScoringController));

/**
 * @swagger
 * /leaderboardScoring/{tournamentId}/games/{gameId}/leaderboard:
 *   get:
 *     summary: Get game-specific leaderboard
 *     tags: [leaderboardScoring]
 *     description: Get the leaderboard for a specific game within a tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game leaderboard retrieved successfully
 *       404:
 *         description: Tournament or game leaderboard not found
 *       500:
 *         description: Server error
 */
router.get('/:tournamentId/games/:gameId/leaderboard', leaderboardScoringController.getGameLeaderboard.bind(leaderboardScoringController));

export default router;