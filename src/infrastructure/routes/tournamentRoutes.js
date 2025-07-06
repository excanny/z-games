import express from 'express';
import TournamentController from '../../adapters/controllers/tournamentController.js';

const router = express.Router();

// Initialize TournamentController
const tournamentController = new TournamentController();

/**
 * @swagger
 * tags:
 *   - name: Tournaments
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
 *       properties:
 *         teamId:
 *           type: string
 *         score:
 *           type: number
 *         playerScores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *               score:
 *                 type: number
 *               achievements:
 *                 type: array
 *                 items:
 *                   type: string
 *               playTime:
 *                 type: number
 *               completedAt:
 *                 type: string
 *                 format: date-time
 */

// ===== TOURNAMENT MANAGEMENT ROUTES =====

/**
 * @swagger
 * /tournaments:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournaments]
 *     description: Create a new tournament with teams and players
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTournamentRequest'
 *           example:
 *             tournament:
 *               name: "Test Tournament"
 *               description: "Test tournament description"
 *               createdAt: "2025-07-02T18:15:48.980Z"
 *             teams:
 *               - id: "1751480097009"
 *                 name: "Sabi"
 *                 players:
 *                   - id: 1751480107962
 *                     name: "YesMan"
 *                     avatar: "🐯"
 *                     avatarName: "Tiger"
 *               - id: "1751480122208"
 *                 name: "Know"
 *                 players:
 *                   - id: 1751480128968
 *                     name: "HAha"
 *                     avatar: "🐸"
 *                     avatarName: "Frog"
 *     responses:
 *       201:
 *         description: Tournament created successfully
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
 *                   example: "Tournament created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all tournaments
 *     tags: [Tournaments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by tournament status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Tournaments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *       500:
 *         description: Server error
 */
router.post('/', tournamentController.createTournament.bind(tournamentController));
router.get('/', tournamentController.getAllTournaments.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tournament'
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update tournament
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tournamentName:
 *                 type: string
 *               tournamentType:
 *                 type: string
 *                 enum: [single_elimination, round_robin, swiss, custom]
 *               currentRoundNumber:
 *                 type: integer
 *                 minimum: 1
 *               currentMatchNumber:
 *                 type: integer
 *                 minimum: 1
 *               players:
 *                 type: array
 *                 items:
 *                   type: string
 *               teams:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 $ref: '#/components/schemas/GameSettings'
 *     responses:
 *       200:
 *         description: Tournament updated successfully
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete tournament
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament deleted successfully
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Server error
 */
router.get('/:id', tournamentController.getTournamentById.bind(tournamentController));
router.put('/:id', tournamentController.updateTournament.bind(tournamentController));
router.delete('/:id', tournamentController.deleteTournament.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{tournamentId}/teams:
 *   post:
 *     summary: Add team to tournament
 *     tags: [Tournaments]
 *     description: Add an existing team to the tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *             properties:
 *               teamId:
 *                 type: string
 *                 description: Team ID to add to tournament
 *     responses:
 *       200:
 *         description: Team added successfully
 *       400:
 *         description: Invalid team ID
 *       404:
 *         description: Tournament or team not found
 *       500:
 *         description: Server error
 */
router.post('/:tournamentId/teams', tournamentController.addTeamToTournament.bind(tournamentController));

export default router;