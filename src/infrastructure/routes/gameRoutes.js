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
 */

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

module.exports = router;
