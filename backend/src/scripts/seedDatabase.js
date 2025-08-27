require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const NFLTeam = require('../models/NFLTeam');
const League = require('../models/League');
const connectDB = require('../config/database');
const NFLDataService = require('../services/nflDataService');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await NFLTeam.deleteMany({});
    await League.deleteMany({});
    
    // Seed NFL Teams
    console.log('🏈 Seeding NFL teams...');
    await NFLDataService.seedNFLTeams();
    
    // Create Super User
    console.log('👑 Creating super user...');
    const adminPassword = process.env.SUPER_USER_PASSWORD || 'Admin123!';
    console.log(`🔍 Using admin password: ${adminPassword}`);
    const superUser = await User.create({
      username: 'admin',
      email: process.env.SUPER_USER_EMAIL || 'admin@nflownyourteam.com',
      password: adminPassword,
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
      },
      {
        username: 'mikechamp',
        email: 'mike@example.com',
        password: 'Password123!',
        firstName: 'Mike',
        lastName: 'Wilson',
        isVerified: true
      },
      {
        username: 'lisafootball',
        email: 'lisa@example.com',
        password: 'Password123!',
        firstName: 'Lisa',
        lastName: 'Davis',
        isVerified: true
      }
    ];
    
    const users = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      users.push(user);
    }
    console.log(`✅ Created ${users.length} sample users`);
    
    // Create sample league
    console.log('🏆 Creating sample league...');
    const nflTeams = await NFLTeam.find({ isActive: true }).select('_id');
    
    const sampleLeague = await League.create({
      name: 'Championship League 2024',
      description: 'A competitive league for serious NFL fans',
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
      auctionSettings: {
        startingBudget: 1000,
        minimumBid: 1,
        bidIncrement: 1,
        auctionTimer: 60
      },
      payoutStructure: {
        regularSeasonWin: 2.0,
        wildCardWin: 5.0,
        divisionalWin: 8.0,
        conferenceChampionshipWin: 15.0,
        superBowlAppearance: 25.0,
        superBowlWin: 45.0
      },
      teams: nflTeams.map(team => ({
        nflTeam: team._id,
        owner: null,
        purchasePrice: 0,
        currentEarnings: 0
      })),
      status: 'draft',
      isPrivate: true
    });
    
    // Update users with league reference
    await User.updateMany(
      { _id: { $in: users.map(u => u._id) } },
      { $push: { leagues: sampleLeague._id } }
    );
    
    console.log(`✅ Sample league created: ${sampleLeague.name} (Code: ${sampleLeague.inviteCode})`);
    
    // Add some sample NFL results
    console.log('📊 Adding sample NFL results...');
    const sampleTeams = await NFLTeam.find({ isActive: true }).limit(8);
    
    for (let i = 0; i < sampleTeams.length; i++) {
      const team = sampleTeams[i];
      
      // Add some sample weekly results
      for (let week = 1; week <= 5; week++) {
        const teamScore = Math.floor(Math.random() * 35) + 10;
        const opponentScore = Math.floor(Math.random() * 35) + 10;
        const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T';
        
        team.updateWeeklyResult(
          week,
          result,
          teamScore,
          opponentScore,
          'OPP',
          Math.random() > 0.5,
          new Date(2024, 8, week * 7), // September + week
          false
        );
      }
      
      await team.save();
    }
    
    console.log('✅ Sample NFL results added');
    
    // Print summary
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   👑 Super User: ${superUser.email} / ${adminPassword}`);
    console.log(`   👥 Sample Users: ${users.length} created`);
    console.log(`   🏈 NFL Teams: ${nflTeams.length} created`);
    console.log(`   🏆 Sample League: "${sampleLeague.name}" (Code: ${sampleLeague.inviteCode})`);
    console.log('\n🚀 You can now start the server and begin testing!\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📱 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding
seedDatabase();
