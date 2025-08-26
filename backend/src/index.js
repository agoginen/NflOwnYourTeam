require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leagueRoutes = require('./routes/leagues');
const teamRoutes = require('./routes/teams');
const auctionRoutes = require('./routes/auctions');
const nflRoutes = require('./routes/nfl');
const adminRoutes = require('./routes/admin');

const { errorHandler } = require('./middleware/errorHandler');
const setupCronJobs = require('./services/cronJobs');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Connect to database and seed if needed
connectDB().then(async () => {
  // Debug environment variables
  console.log('🔍 Environment Check:');
  console.log('   USE_IN_MEMORY_DB:', process.env.USE_IN_MEMORY_DB);
  console.log('   SUPER_USER_PASSWORD:', process.env.SUPER_USER_PASSWORD ? '[SET]' : '[NOT SET]');
  
  // Auto-seed database if using in-memory DB and no users exist
  const useInMemory = String(process.env.USE_IN_MEMORY_DB || '').toLowerCase() === 'true';
  console.log('   Using in-memory DB:', useInMemory);
  
  if (useInMemory) {
    const User = require('./models/User');
    const NFLTeam = require('./models/NFLTeam');
    const userCount = await User.countDocuments();
    console.log('   Current user count:', userCount);
    
    if (userCount === 0) {
      console.log('🌱 Auto-seeding in-memory database...');
      
      try {
        // Seed NFL Teams
        const nflDataService = require('./services/nflDataService');
        await nflDataService.seedNFLTeams();
        
        // Create Super User
        console.log('👑 Creating super user...');
        const superUser = await User.create({
          username: 'admin',
          email: process.env.SUPER_USER_EMAIL || 'admin@nflownyourteam.com',
          password: process.env.SUPER_USER_PASSWORD || 'Password123!',
          firstName: 'Super',
          lastName: 'Admin',
          isSuperUser: true,
          isVerified: true
        });
        console.log(`✅ Super user created: ${superUser.email}`);
        
        // Create sample users
        console.log('👥 Creating sample users...');
        const sampleUsers = [
          {
            username: 'johnfan',
            email: 'john@example.com',
            password: 'Password123!',
            firstName: 'John',
            lastName: 'Smith',
            isVerified: true
          },
          {
            username: 'sarahwins',
            email: 'sarah@example.com',
            password: 'Password123!',
            firstName: 'Sarah',
            lastName: 'Johnson',
            isVerified: true
          }
        ];
        
        const users = await User.insertMany(sampleUsers);
        console.log(`✅ Created ${users.length} sample users`);
        console.log('🎉 Auto-seeding completed successfully!');
        
      } catch (error) {
        console.error('❌ Error auto-seeding database:', error);
      }
    }
  }
});

// Trust proxy for rate limiting (required for development)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: () => process.env.NODE_ENV === 'development'
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Make io available to routes
app.set('io', io);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NFL Own Your Team API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/nfl', nflRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'NFL Own Your Team API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-league', (leagueId) => {
    socket.join(`league-${leagueId}`);
    console.log(`Socket ${socket.id} joined league ${leagueId}`);
  });

  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`Socket ${socket.id} joined auction ${auctionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Setup cron jobs for NFL data updates
setupCronJobs();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🏈 NFL Own Your Team API Server Running
🚀 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
📚 API Documentation: http://localhost:${PORT}/api-docs
⏰ Cron jobs: Active
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server, io };
