// src/utils/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow DB API',
      version: '1.0.0',
      description: 'API documentation for TaskFlow DB Backend cloud persisted service',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './server.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
