import express from 'express';
import GameController from '../../adapters/controllers/gameController.js';

const router = express.Router();

// Initialize GameController
const gameController = new GameController();


/**
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Adventure Quest"
 *         availableCharacters:
 *           type: integer
 *           example: 5
 *         applicableSuperpowers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               animal:
 *                 type: string
 *               power:
 *                 type: string
 *     GameSession:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d0fe4f5311236168a109ca"
 *         name:
 *           type: string
 *           example: "Tournament Finals"
 *         date:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [planning, active, completed, cancelled]
 *           example: "active"
 *         players:
 *           type: array
 *           items:
 *             type: string
 *         teams:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               players:
 *                 type: array
 *                 items:
 *                   type: string
 *         gamesPlayed:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Quiz Game", "Memory Challenge"]
 *         settings:
 *           type: object
 *           properties:
 *             gameMode:
 *               type: string
 *               enum: [individual, team]
 *             scoringMode:
 *               type: string
 *               enum: [individual, team, both]
 *         scores:
 *           type: object
 *           properties:
 *             individual:
 *               type: array
 *               items:
 *                 type: object
 *             team:
 *               type: array
 *               items:
 *                 type: object
 *         leaderboard:
 *           type: object
 *           properties:
 *             individual:
 *               type: array
 *               items:
 *                 type: object
 *             team:
 *               type: array
 *               items:
 *                 type: object
 *     GameResult:
 *       type: object
 *       properties:
 *         gameName:
 *           type: string
 *           example: "Quiz Game"
 *         playerScores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *               points:
 *                 type: number
 *               rank:
 *                 type: number
 *         teamScores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *               points:
 *                 type: number
 *               rank:
 *                 type: number
 *     Animal:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Eagle"
 *         superpower:
 *           type: object
 *           properties:
 *             applicableGames:
 *               type: array
 *               items:
 *                 type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message"
 *         error:
 *           type: string
 *           example: "Detailed error information"
 */

// =================== GAME DISCOVERY ROUTES ===================

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     tags: [Games]
 *     description: Retrieve a list of all games in the system
 *     responses:
 *       200:
 *         description: List of games retrieved successfully
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
 *                     $ref: '#/components/schemas/Game'
 */
router.get('/', async (req, res) => {
  try {
    await gameController.getAllGames(req, res);
  } catch (error) {
    console.error('Error in / route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get games',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /games/type/{type}:
 *   get:
 *     summary: Get games by type
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Game type
 *     responses:
 *       200:
 *         description: Games retrieved successfully
 */
router.get('/type/:type', async (req, res) => {
  try {
    await gameController.getGamesByType(req, res);
  } catch (error) {
    console.error('Error in /type/:type route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get games by type',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /games/name/{name}:
 *   get:
 *     summary: Get game by name
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Game name
 *     responses:
 *       200:
 *         description: Game retrieved successfully
 *       404:
 *         description: Game not found
 */
router.get('/name/:name', async (req, res) => {
  try {
    await gameController.getGameByName(req, res);
  } catch (error) {
    console.error('Error in /name/:name route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game by name',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get game by ID
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Game'
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', async (req, res) => {
  try {
    await gameController.getGameById(req, res);
  } catch (error) {
    console.error('Error in /:id route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game by ID',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


// =================== CHARACTER SELECTION ROUTES ===================

/**
 * @swagger
 * /games/{gameName}/characters:
 *   get:
 *     summary: Get character selection for a specific game
 *     tags: [Games]
 *     description: Retrieve available characters (animals) for a specific game with pagination
 *     parameters:
 *       - in: path
 *         name: gameName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the game
 *         example: "Sky Racing"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of characters to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of characters to skip
 *     responses:
 *       200:
 *         description: Characters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 game:
 *                   type: string
 *                   example: "Sky Racing"
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 offset:
 *                   type: integer
 *                   example: 0
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Animal'
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:gameName/characters', async (req, res) => {
  try {
    await gameController.getGameCharacters(req, res);
  } catch (error) {
    console.error('Error in /:gameName/characters route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game characters',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /games/select-character:
 *   post:
 *     summary: Select a character for a game session
 *     tags: [Games]
 *     description: Select an animal character for a specific game and create a game session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - animalName
 *               - gameName
 *               - playerId
 *             properties:
 *               animalName:
 *                 type: string
 *                 description: Name of the animal character to select
 *                 example: "Eagle"
 *               gameName:
 *                 type: string
 *                 description: Name of the game
 *                 example: "Sky Racing"
 *               playerId:
 *                 type: string
 *                 description: Unique identifier for the player
 *                 example: "player123"
 *     responses:
 *       201:
 *         description: Character selected successfully and game session created
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
 *                   example: "Character selected successfully"
 *                 data:
 *                   $ref: '#/components/schemas/GameSession'
 *       400:
 *         description: Bad request - missing required fields or invalid character/game combination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "animalName, gameName, and playerId are required"
 *               unsuitable:
 *                 summary: Animal not suitable for game
 *                 value:
 *                   success: false
 *                   message: "Animal 'Lion' is not suitable for game 'Sky Racing'"
 *       404:
 *         description: Animal not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Animal 'UnknownAnimal' not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/select-character', async (req, res) => {
  try {
    await gameController.selectCharacter(req, res);
  } catch (error) {
    console.error('Error in /select-character route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select character',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


// =================== HEALTH CHECK ROUTE ===================

/**
 * @swagger
 * /games/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Games]
 *     description: Check if the games service is running properly
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                   example: "Games service is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Games service is healthy',
    timestamp: new Date().toISOString()
  });
});

// =================== ERROR HANDLING MIDDLEWARE ===================

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('Game routes error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error in games service',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default router;