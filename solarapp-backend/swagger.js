/**
 * Swagger/OpenAPI Documentation Setup
 * Provides comprehensive API documentation with interactive UI
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SolarApp Backend API',
      version: '1.0.0',
      description: 'Comprehensive REST API for Solar Installation Management System',
      contact: {
        name: 'SolarApp Team',
        email: 'support@solarapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000/api',
        description: 'Development Server'
      },
      {
        url: 'https://api.solarapp.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for API authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            contactNo: { type: 'string' },
            pincodeAccess: { type: 'string' },
            roleId: { type: 'integer' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            leadCode: { type: 'string' },
            customerName: { type: 'string' },
            contactNo: { type: 'string' },
            address: { type: 'string' },
            pincode: { type: 'string' },
            unitCapacitySelection: { type: 'string' },
            status: { type: 'string' },
            createdById: { type: 'integer' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            leadId: { type: 'integer' },
            customerId: { type: 'integer' },
            totalAmount: { type: 'number' },
            loanRequired: { type: 'boolean' },
            loanStatus: { type: 'string' },
            orderStatus: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            requestId: { type: 'string' },
            code: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission for this action',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        BadRequestError: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: [
    './routes/authRoutes.js',
    './routes/leadRoutes.js',
    './routes/orderRoutes.js',
    './routes/masterRoutes.js',
    './routes/serviceRoutes.js',
    './routes/dashboardRoutes.js',
    './routes/auditRoutes.js',
    './routes/hrRoutes.js',
    './routes/visitRoutes.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
