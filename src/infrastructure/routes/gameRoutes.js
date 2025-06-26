const express = require("express");
const GameController = require("../../adapters/controllers/gameController").default;
const GameUseCase = require("../../use-cases/gameUseCase").default;
const GameRepository = require("../repositories/gameRepository");
const gamesMasterAuth = require("../../middlewares/authMiddleware");

const router = express.Router();

// Initialize Repositories and UseCases
const gameRepository = new GameRepository();
const gameUseCase = new GameUseCase(gameRepository);
const gameController = new GameController(gameUseCase);

/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Game management routes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Participant:
 *       type: object
 *       required:
 *         - name
 *         - avatar
 *         - color
 *         - score
 *       properties:
 *         name:
 *           type: string
 *           example: "Alice"
 *         avatar:
 *           type: string
 *           example: "fox"
 *         color:
 *           type: string
 *           example: "#FF5733"
 *         score:
 *           type: number
 *           example: 10
 *         isActive:
 *           type: boolean
 *           example: true
 *     Game:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60f7c3b2e5e4f3a4b4f4d3e2"
 *         name:
 *           type: string
 *           example: "Summer Tournament"
 *         isActive:
 *           type: boolean
 *           example: true
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Participant'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-06-16T09:00:00.000Z"
 *     PlayerData:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Bob"
 *         avatar:
 *           type: string
 *           example: "cat"
 *         color:
 *           type: string
 *           example: "#33FF57"
 *     GameStats:
 *       type: object
 *       properties:
 *         totalParticipants:
 *           type: number
 *           example: 8
 *         activeParticipants:
 *           type: number
 *           example: 6
 *         inactiveParticipants:
 *           type: number
 *           example: 2
 *         averageScore:
 *           type: number
 *           example: 15.5
 *         highestScore:
 *           type: number
 *           example: 25
 *         lowestScore:
 *           type: number
 *           example: 5
 *     BulkOperationResult:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalProcessed:
 *               type: number
 *               example: 5
 *             added:
 *               type: number
 *               example: 3
 *             reactivated:
 *               type: number
 *               example: 1
 *             failed:
 *               type: number
 *               example: 1
 *         results:
 *           type: object
 *           properties:
 *             added:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 *             reactivated:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 *             failed:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   player:
 *                     type: string
 *                   error:
 *                     type: string
 */

// =================== GAME MANAGEMENT ROUTES ===================

/**
 * @swagger
 * /games:
 *   post:
 *     summary: Create a new game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - participants
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Adventure Quest"
 *               participants:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Participant'
 *     responses:
 *       201:
 *         description: Game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.post("/", gameController.createGame.bind(gameController));

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: List of all games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 */
router.get("/", gameController.getAllGames.bind(gameController));

/**
 * @swagger
 * /games/active:
 *   get:
 *     summary: Get the currently active game
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: The active game
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.get("/active", gameController.getActiveGame.bind(gameController));

/**
 * @swagger
 * /games/code/{gameCode}:
 *   get:
 *     summary: Get a game by game code
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The game code of the game
 *         example: "summer-tournament-2025"
 *     responses:
 *       200:
 *         description: Game found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       404:
 *         description: Game not found
 */
router.get("/code/:gameCode", gameController.getGameByGameCode.bind(gameController));

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get a game by ID
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.get("/:id", gameController.getGameById.bind(gameController));

/**
 * @swagger
 * /games/{id}:
 *   put:
 *     summary: Update a game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Tournament Name"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Game updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.put("/:id", gameController.updateGame.bind(gameController));

/**
 * @swagger
 * /games/{id}/leaderboard:
 *   get:
 *     summary: Get leaderboard for a specific game
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     responses:
 *       200:
 *         description: Leaderboard for the game
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gameId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Alice"
 *                       score:
 *                         type: number
 *                         example: 20
 *                       avatar:
 *                         type: string
 *                         example: "fox"
 *                       color:
 *                         type: string
 *                         example: "#FF5733"
 */
router.get("/:id/leaderboard", gameController.getLeaderboard.bind(gameController));

// =================== GAME STATISTICS ROUTES ===================

/**
 * @swagger
 * /games/{gameId}/stats:
 *   get:
 *     summary: Get game statistics
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     responses:
 *       200:
 *         description: Game statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStats'
 *       404:
 *         description: Game not found
 */
router.get("/:gameId/stats", gameController.getGameStats.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/longest-streak:
 *   get:
 *     summary: Get player with longest streak
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     responses:
 *       200:
 *         description: Longest streak retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 player:
 *                   $ref: '#/components/schemas/Participant'
 *                 streak:
 *                   type: number
 *                   example: 5
 *       404:
 *         description: Game not found
 */
router.get("/:gameId/longest-streak", gameController.getLongestStreak.bind(gameController));

// =================== PARTICIPANT MANAGEMENT ROUTES ===================

/**
 * @swagger
 * /games/{gameId}/participants:
 *   get:
 *     summary: Get all participants for a game
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: all
 *         description: Filter participants by status
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 */
router.get("/:gameId/participants", gameController.getParticipants.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/participants/{playerName}:
 *   get:
 *     summary: Get a specific participant
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *       - in: path
 *         name: playerName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the participant
 *     responses:
 *       200:
 *         description: Participant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Participant'
 *       404:
 *         description: Participant not found
 */
router.get("/:gameId/participants/:playerName", gameController.getParticipant.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/participants/score:
 *   patch:
 *     summary: Update a participant's score by a delta value
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scoreDelta
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alice"
 *               scoreDelta:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Score updated successfully
 *       400:
 *         description: Invalid input or update failed
 *       404:
 *         description: Game or participant not found
 */
router.patch("/:gameId/participants/score", gameController.updateParticipantScore.bind(gameController));

// =================== PLAYER MANAGEMENT ROUTES ===================

/**
 * @swagger
 * /games/{gameId}/players:
 *   post:
 *     summary: Add a new player to a game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlayerData'
 *     responses:
 *       201:
 *         description: Player added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Participant'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Game not found
 *       409:
 *         description: Player already exists
 */
router.post("/:gameId/players", gameController.addPlayer.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/players/{playerName}:
 *   delete:
 *     summary: Remove a player from a game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *       - in: path
 *         name: playerName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the player to remove
 *     responses:
 *       200:
 *         description: Player removed successfully
 *       400:
 *         description: Player already inactive
 *       404:
 *         description: Game or player not found
 */
router.delete("/:gameId/players/:playerName", gameController.removePlayer.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/players/{playerName}/reactivate:
 *   put:
 *     summary: Reactivate a previously removed player
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *       - in: path
 *         name: playerName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the player to reactivate
 *     responses:
 *       200:
 *         description: Player reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Participant'
 *       400:
 *         description: Player already active
 *       404:
 *         description: Game or player not found
 */
router.put("/:gameId/players/:playerName/reactivate", gameController.reactivatePlayer.bind(gameController));

// =================== BULK OPERATIONS ROUTES ===================

/**
 * @swagger
 * /games/{gameId}/players/bulk-add:
 *   post:
 *     summary: Add multiple players to a game in bulk
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - players
 *             properties:
 *               players:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/PlayerData'
 *                 example:
 *                   - name: "Alice"
 *                     avatar: "fox"
 *                     color: "#FF5733"
 *                   - name: "Bob"
 *                     avatar: "cat"
 *                     color: "#33FF57"
 *     responses:
 *       200:
 *         description: All players added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkOperationResult'
 *       207:
 *         description: Some players added successfully, some failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkOperationResult'
 *       400:
 *         description: All operations failed or invalid input
 *       404:
 *         description: Game not found
 */
router.post("/:gameId/players/bulk-add", gameController.addBulkPlayers.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/players/validate:
 *   post:
 *     summary: Validate bulk player data without adding them
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - players
 *             properties:
 *               players:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/PlayerData'
 *     responses:
 *       200:
 *         description: Validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     valid:
 *                       type: number
 *                     invalid:
 *                       type: number
 *                     hasErrors:
 *                       type: boolean
 *                 valid:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlayerData'
 *                 invalid:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       player:
 *                         type: object
 *                       errors:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.post("/:gameId/players/validate", gameController.validateBulkPlayerData.bind(gameController));

/**
 * @swagger
 * /games/{gameId}/players/bulk:
 *   post:
 *     summary: Generic bulk player operations (legacy support)
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - players
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [add, remove, reactivate]
 *                 example: "add"
 *               players:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/PlayerData'
 *                     description: For 'add' action
 *                   - type: array
 *                     items:
 *                       type: string
 *                     description: For 'remove' and 'reactivate' actions
 *                     example: ["Alice", "Bob"]
 *     responses:
 *       200:
 *         description: All operations successful
 *       207:
 *         description: Some operations successful, some failed
 *       400:
 *         description: All operations failed or invalid input
 */
router.post("/:gameId/players/bulk", gameController.bulkPlayerOperations.bind(gameController));

module.exports = router;