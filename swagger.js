const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Z Games API",
    version: "1.0.0",
    description: "API documentation for Z Games, a gaming platform",
  },
  servers: [
    {
      url: "http://localhost:5000/api",  // Update if your API is hosted elsewhere
      description: "Local server",
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ["./src/infrastructure/routes/*.js"],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
