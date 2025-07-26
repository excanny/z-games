import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Z Games API',
    version: '1.0.0',
    description: 'API documentation for Z Games, a gaming platform',
  },
  servers: [
    {
      //url: 'http://localhost:5000/api', // Update if your API is hosted elsewhere
      url: `${process.env.BASE_URL}/api`, // Use your actual API URL
      description: 'Local server',
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ['./src/infrastructure/routes/*.js'], // Use .ts if you're using TypeScript
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
