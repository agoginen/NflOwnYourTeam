require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models
const User = require('../models/User');
const NFLTeam = require('../models/NFLTeam');
const League = require('../models/League');
const NFLDataService = require('../services/nflDataService');

let mongod;

const connectToMemoryDB = async () => {
  try {
    // Start in-memory MongoDB instance
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'nfl-own-your-team-test'
      }
    });
    
    const uri = mongod.getUri();
    console.log('📋 Using in-memory MongoDB:', uri);
    
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to in-memory MongoDB:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding with in-memory MongoDB...');
    
    // Connect to in-memory database
    await connectToMemoryDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await NFLTeam.deleteMany({});
    await League.deleteMany({});
    
    // Seed NFL Teams
    console.log('🏈 Seeding NFL teams...');
    await NFLDataService.seedNFLTeams();
    
    // Create Super User
    console.log('👑 Creating super user...');
    const superUser = await User.create({
      username: 'admin',
      email: process.env.SUPER_USER_EMAIL || 'admin@nflownyourteam.com',
      password: process.env.SUPER_USER_PASSWORD || 'Admin123!',
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
    
    // Create sample league
    console.log('🏆 Creating sample league...');
    const nflTeams = await NFLTeam.find({ isActive: true }).select('_id');
    
    const sampleLeague = await League.create({
      name: 'Test League 2024',
      description: 'A test league for development',
      inviteCode: await League.generateInviteCode(),
      creator: users[0]._id,
      members: users.map(user => ({
        user: user._id,
        joinedAt: new Date(),
        isActive: true
      })),
      maxMembers: 10,
      season: {
        year: 2024,
        startDate: new Date('2024-09-05'),
        endDate: new Date('2025-02-15')
      },
      teams: nflTeams.map(team => ({
        nflTeam: team._id,
        owner: null,
        purchasePrice: 0,
        currentEarnings: 0
      })),
      status: 'draft'
    });
    
    console.log(`✅ Sample league created: ${sampleLeague.name} (Code: ${sampleLeague.inviteCode})`);
    
    // Print summary
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   👑 Super User: ${superUser.email} / ${process.env.SUPER_USER_PASSWORD || 'Admin123!'}`);
    console.log(`   👥 Sample Users: ${users.length} created`);
    console.log(`   🏈 NFL Teams: ${nflTeams.length} created`);
    console.log(`   🏆 Sample League: "${sampleLeague.name}" (Code: ${sampleLeague.inviteCode})`);
    console.log('\n💡 This uses an in-memory database for testing.');
    console.log('   Data will be lost when the process stops.');
    console.log('   For persistent data, install MongoDB or use MongoDB Atlas.\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Keep the database running for testing
    console.log('🔄 Database ready for testing. Press Ctrl+C to stop.');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await mongoose.connection.close();
      if (mongod) {
        await mongod.stop();
      }
      console.log('📱 Database connection closed');
      process.exit(0);
    });
  }
};

// Run the seeding
seedDatabase();
