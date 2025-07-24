import express from 'express';
import AuthController from '../../adapters/controllers/authController.js';
import UserRepository from '../repositories/userRepository.js';

const router = express.Router();
const userRepository = new UserRepository();
const authController = new AuthController(userRepository);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "strongpassword123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/register', authController.register.bind(authController));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     description: Authenticate a user and return a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login.bind(authController));

export default router;
