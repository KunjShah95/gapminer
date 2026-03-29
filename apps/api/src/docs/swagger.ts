import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GapMiner Multi-Agent Talent Intelligence API',
      version: '1.0.0',
      description: 'API for Intelligent Resume Parsing, Skill Normalization, and Semantic Talent Matching.',
      contact: {
        name: 'Prama Innovations',
        url: 'https://prama.ai',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/api/v1/endpoints/*.js', './src/api/v1/endpoints/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('Swagger documentation available at http://localhost:8000/api-docs');
}
