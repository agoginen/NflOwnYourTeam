const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NFL Own Your Team API',
      version: '1.0.0',
      description: 'Comprehensive NFL fantasy application API where users bid on entire NFL teams',
      contact: {
        name: 'API Support',
        email: 'support@nflownyourteam.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.nflownyourteam.com',
        description: 'Production server',
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
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstName', 'lastName'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Unique username',
              minLength: 3,
              maxLength: 30,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
            },
            balance: {
              type: 'number',
              description: 'User account balance',
              minimum: 0,
            },
            isVerified: {
              type: 'boolean',
              description: 'Email verification status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        League: {
          type: 'object',
          required: ['name', 'creator'],
          properties: {
            _id: {
              type: 'string',
              description: 'League ID',
            },
            name: {
              type: 'string',
              description: 'League name',
              minLength: 3,
              maxLength: 100,
            },
            description: {
              type: 'string',
              description: 'League description',
            },
            inviteCode: {
              type: 'string',
              description: 'Unique invite code',
              minLength: 6,
              maxLength: 10,
            },
            creator: {
              type: 'string',
              description: 'Creator user ID',
            },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: {
                    type: 'string',
                    description: 'User ID',
                  },
                  role: {
                    type: 'string',
                    enum: ['admin', 'member'],
                  },
                  joinedAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                  currentBudget: {
                    type: 'number',
                    minimum: 0,
                  },
                },
              },
            },
            status: {
              type: 'string',
              enum: ['draft', 'auction', 'active', 'completed'],
              description: 'League status',
            },
            auctionSettings: {
              type: 'object',
              properties: {
                startingBudget: {
                  type: 'number',
                  minimum: 100,
                },
                auctionDuration: {
                  type: 'number',
                  minimum: 30,
                },
                payoutStructure: {
                  type: 'object',
                  properties: {
                    regularSeasonWin: { type: 'number', minimum: 0, maximum: 1 },
                    wildCardWin: { type: 'number', minimum: 0, maximum: 1 },
                    divisionalWin: { type: 'number', minimum: 0, maximum: 1 },
                    conferenceWin: { type: 'number', minimum: 0, maximum: 1 },
                    superBowlAppearance: { type: 'number', minimum: 0, maximum: 1 },
                    superBowlWin: { type: 'number', minimum: 0, maximum: 1 },
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        NFLTeam: {
          type: 'object',
          required: ['name', 'abbreviation', 'city', 'conference', 'division'],
          properties: {
            _id: {
              type: 'string',
              description: 'Team ID',
            },
            name: {
              type: 'string',
              description: 'Team name',
            },
            abbreviation: {
              type: 'string',
              description: 'Team abbreviation (e.g., KC, TB)',
              minLength: 2,
              maxLength: 3,
            },
            city: {
              type: 'string',
              description: 'Team city',
            },
            conference: {
              type: 'string',
              enum: ['AFC', 'NFC'],
              description: 'Conference',
            },
            division: {
              type: 'string',
              enum: ['East', 'North', 'South', 'West'],
              description: 'Division',
            },
            primaryColor: {
              type: 'string',
              description: 'Primary team color (hex)',
            },
            secondaryColor: {
              type: 'string',
              description: 'Secondary team color (hex)',
            },
            logoUrl: {
              type: 'string',
              description: 'Team logo URL',
            },
            currentSeason: {
              type: 'object',
              properties: {
                year: {
                  type: 'number',
                  description: 'Season year',
                },
                wins: {
                  type: 'number',
                  minimum: 0,
                },
                losses: {
                  type: 'number',
                  minimum: 0,
                },
                ties: {
                  type: 'number',
                  minimum: 0,
                },
                playoffStatus: {
                  type: 'string',
                  enum: ['none', 'wildcard', 'divisional', 'conference', 'superbowl', 'champion'],
                },
              },
            },
          },
        },
        Auction: {
          type: 'object',
          required: ['league', 'team', 'nominator'],
          properties: {
            _id: {
              type: 'string',
              description: 'Auction ID',
            },
            league: {
              type: 'string',
              description: 'League ID',
            },
            team: {
              type: 'string',
              description: 'NFL Team ID',
            },
            nominator: {
              type: 'string',
              description: 'User ID who nominated the team',
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled'],
            },
            currentBid: {
              type: 'number',
              minimum: 0,
            },
            currentBidder: {
              type: 'string',
              description: 'Current highest bidder user ID',
            },
            bids: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: {
                    type: 'string',
                    description: 'Bidder user ID',
                  },
                  amount: {
                    type: 'number',
                    minimum: 0,
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            finalWinner: {
              type: 'string',
              description: 'Final winning user ID',
            },
            finalAmount: {
              type: 'number',
              minimum: 0,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            status: {
              type: 'number',
              description: 'HTTP status code',
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            password: {
              type: 'string',
              description: 'User password',
              minLength: 6,
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstName', 'lastName'],
          properties: {
            username: {
              type: 'string',
              description: 'Unique username',
              minLength: 3,
              maxLength: 30,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            password: {
              type: 'string',
              description: 'User password',
              minLength: 6,
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
