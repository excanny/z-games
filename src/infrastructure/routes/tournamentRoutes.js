import express from 'express';
import TournamentController from '../../adapters/controllers/TournamentController.js';

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
 *         animalAvatar:
 *           type: string
 *           example: "tiger"
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
 *     CreateTeamRequest:
 *       type: object
 *       required:
 *         - name
 *         - players
 *       properties:
 *         name:
 *           type: string
 *           example: "New Team"
 *         players:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Player Name"
 *               avatar:
 *                 type: string
 *                 example: "🐯"
 *               animalAvatar:
 *                 type: string
 *                 example: "tiger"
 *           minItems: 1
 *     CreatePlayerRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Player Name"
 *         avatar:
 *           type: string
 *           example: "🐯"
 *         animalAvatar:
 *           type: string
 *           example: "tiger"
 *     MovePlayerRequest:
 *       type: object
 *       required:
 *         - fromTeamId
 *         - toTeamId
 *       properties:
 *         fromTeamId:
 *           type: string
 *           example: "team1"
 *         toTeamId:
 *           type: string
 *           example: "team2"
 *     UpdateStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *           example: "in_progress"
 *     SetCurrentGameRequest:
 *       type: object
 *       required:
 *         - gameId
 *       properties:
 *         gameId:
 *           type: string
 *           example: "game123"
 */

// ===== TOURNAMENT MANAGEMENT ROUTES =====

/**
 * @swagger
 * /tournaments/leaderboard:
 *   get:
 *     summary: Get active tournament leaderboard
 *     tags: [Tournaments]
 *     description: Get the leaderboard for the currently active tournament with teams, players, and game information
 *     responses:
 *       200:
 *         description: Tournament leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournamentId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the tournament
 *                     teamRankings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           totalScore:
 *                             type: number
 *                           players:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 name:
 *                                   type: string
 *                                 score:
 *                                   type: number
 *                                 animal:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                     emoji:
 *                                       type: string
 *                     playerRankings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           score:
 *                             type: number
 *                           teamName:
 *                             type: string
 *                           teamId:
 *                             type: string
 *                             format: uuid
 *                           animal:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               emoji:
 *                                 type: string
 *                     totalTeams:
 *                       type: number
 *                       description: Total number of teams in the tournament
 *                     totalPlayers:
 *                       type: number
 *                       description: Total number of players in the tournament
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       description: When the leaderboard was last updated
 *       404:
 *         description: No active tournament found
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
 *                   example: "No active tournament found"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to get tournament leaderboard"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /tournaments/{tournamentId}/leaderboard:
 *   get:
 *     summary: Get specific tournament leaderboard
 *     tags: [Tournaments]
 *     description: Get the leaderboard for a specific tournament with teams, players, and game information
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the tournament
 *     responses:
 *       200:
 *         description: Tournament leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournamentId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the tournament
 *                     teamRankings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           totalScore:
 *                             type: number
 *                           players:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 name:
 *                                   type: string
 *                                 score:
 *                                   type: number
 *                                 animal:
 *                                   type: object
 *                                   properties:
 *                                     name:
 *                                       type: string
 *                                     emoji:
 *                                       type: string
 *                     playerRankings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           score:
 *                             type: number
 *                           teamName:
 *                             type: string
 *                           teamId:
 *                             type: string
 *                             format: uuid
 *                           animal:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               emoji:
 *                                 type: string
 *                     totalTeams:
 *                       type: number
 *                       description: Total number of teams in the tournament
 *                     totalPlayers:
 *                       type: number
 *                       description: Total number of players in the tournament
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       description: When the leaderboard was last updated
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
 *                   example: "Tournament not found"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to get tournament leaderboard"
 *                 error:
 *                   type: string
 */

// Route definitions
router.get('/leaderboard', tournamentController.getLeaderboardForTournament.bind(tournamentController));
router.get('/:tournamentId/leaderboard', tournamentController.getLeaderboardForTournament.bind(tournamentController));

/**
 * @swagger
 * /tournaments:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournaments]
 *     description: Create a new tournament with teams, players, and selected games
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
 *                   - id: "1751480107962"
 *                     name: "YesMan"
 *                     avatar: "🐯"
 *                     avatarName: "Tiger"
 *               - id: "1751480122208"
 *                 name: "Know"
 *                 players:
 *                   - id: "1751480128968"
 *                     name: "HAha"
 *                     avatar: "🐸"
 *                     avatarName: "Frog"
 *             selectedGames:
 *               - "5392e7c7-162e-4b17-8e31-5fc957233a0a"
 *               - "2106ba45-1df6-4f4a-8c7a-a87457703085"
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
 *                   example: "At least one game must be selected for the tournament"
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

// ===== TEAM MANAGEMENT ROUTES =====

/**
 * @swagger
 * /tournaments/{tournamentId}/teams:
 *   post:
 *     summary: Add new team to tournament
 *     tags: [Tournaments]
 *     description: Add a new team with players to an existing tournament
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
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       201:
 *         description: Team added successfully
 *       400:
 *         description: Invalid team data
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Server error
 */
router.post('/:tournamentId/teams', tournamentController.addNewTeamToTournament.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{tournamentId}/add-team:
 *   post:
 *     summary: Add new team to tournament
 *     tags: [Tournaments]
 *     description: Create a new team and add it to the tournament
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
 *               - teamName
 *             properties:
 *               teamName:
 *                 type: string
 *                 description: Name of the team to create and add to tournament
 *                 example: "Big Team"
 *     responses:
 *       200:
 *         description: Team created and added successfully
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
 *                   example: "Team added to tournament"
 *                 data:
 *                   type: object
 *                   description: Updated tournament object
 *       400:
 *         description: Invalid team name or team already exists
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
 *                   example: "Team name is required"
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
 *                   example: "Tournament not found"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to add team to tournament"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 */
router.post('/:tournamentId/add-team', tournamentController.addTeamToTournament.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{tournamentId}/teams/{teamId}:
 *   get:
 *     summary: Get team details
 *     tags: [Tournaments]
 *     description: Get team details
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update team name
 *     tags: [Tournaments]
 *     description: Update team name
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New team name
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Team name updated successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Remove team from tournament
 *     tags: [Tournaments]
 *     description: Remove a team from the tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team removed successfully
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */
router.get('/:tournamentId/teams/:teamId', tournamentController.getTeamWithPlayers.bind(tournamentController));
router.put('/:tournamentId/teams/:teamId', tournamentController.updateTeam.bind(tournamentController));
router.delete('/:tournamentId/teams/:teamId', tournamentController.removeTeamFromTournament.bind(tournamentController));
// ===== PLAYER MANAGEMENT ROUTES =====

/**
 * @swagger
 * /tournaments/{tournamentId}/teams/{teamId}/players:
 *   post:
 *     summary: Add player to team
 *     tags: [Tournaments]
 *     description: Add a new player to an existing team
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlayerRequest'
 *           example:
 *             name: "Player Name"
 *             animalAvatar: "tiger"
 *     responses:
 *       201:
 *         description: Player added successfully
 *       400:
 *         description: Invalid player data
 *       404:
 *         description: Tournament or team not found
 *       500:
 *         description: Server error
 */
router.post('/:tournamentId/teams/:teamId/players', tournamentController.addPlayerToTeam.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{tournamentId}/teams/{teamId}/players/{playerId}:
 *   put:
 *     summary: Update player information
 *     tags: [Tournaments]
 *     description: Update player details
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Player updated successfully
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Remove player from team
 *     tags: [Tournaments]
 *     description: Remove a player from the team
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player removed successfully
 *       404:
 *         description: Player not found
 *       500:
 *         description: Server error
 */
router.put('/:tournamentId/teams/:teamId/players/:playerId', tournamentController.updatePlayer.bind(tournamentController));
router.delete('/:tournamentId/teams/:teamId/players/:playerId', tournamentController.removePlayerFromTeam.bind(tournamentController));

/**
 * @swagger
 * /tournaments/{tournamentId}/players/{playerId}/move:
 *   put:
 *     summary: Move player between teams
 *     tags: [Tournaments]
 *     description: Move a player from one team to another within the same tournament
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MovePlayerRequest'
 *     responses:
 *       200:
 *         description: Player moved successfully
 *       400:
 *         description: Invalid team IDs or same source/destination
 *       404:
 *         description: Player or teams not found
 *       500:
 *         description: Server error
 */
router.put('/:tournamentId/players/:playerId/move', tournamentController.movePlayerBetweenTeams.bind(tournamentController));

// ===== TOURNAMENT STATUS MANAGEMENT ROUTES =====

/**
 * @swagger
 * /tournaments/{tournamentId}/status:
 *   put:
 *     summary: Update tournament active status
 *     tags: [Tournaments]
 *     description: Activate or deactivate a tournament. When deactivated, the overall leaderboard is calculated.
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["active", "inactive"]
 *                 description: Tournament status
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Tournament status updated successfully
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
 *                   example: "Tournament activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Invalid status value or missing parameter
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
 *                   example: "status must be either 'active' or 'inactive'"
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
 *                   example: "Tournament not found"
 *       500:
 *         description: Server error
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
 *                   example: "Failed to update tournament status"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 */
router.put('/:tournamentId/status', tournamentController.updateTournamentStatus.bind(tournamentController));

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateTournamentStatusRequest:
 *       type: object
 *       required:
 *         - isActive
 *       properties:
 *         isActive:
 *           type: boolean
 *           description: Whether the tournament should be active or not
 *           example: true
 *       example:
 *         isActive: true
 */

export default router;