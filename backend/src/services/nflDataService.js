const axios = require('axios');
const NFLTeam = require('../models/NFLTeam');

class NFLDataService {
  constructor() {
    this.baseURL = 'https://api.sportsdata.io/v3/nfl';
    this.apiKey = process.env.NFL_API_KEY;
  }

  // Update weekly NFL game results
  async updateWeeklyResults() {
    try {
      console.log('Fetching NFL weekly results...');
      
      // In a real implementation, you would call an actual NFL API
      // For now, we'll simulate the data update process
      
      const teams = await NFLTeam.find({ isActive: true });
      
      // Simulate updating results for current week
      const currentWeek = this.getCurrentWeek();
      
      for (const team of teams) {
        // Simulate random game results (for demo purposes)
        const hasPlayed = Math.random() > 0.5;
        
        if (hasPlayed) {
          const teamScore = Math.floor(Math.random() * 35) + 10;
          const opponentScore = Math.floor(Math.random() * 35) + 10;
          const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T';
          
          team.updateWeeklyResult(
            currentWeek,
            result,
            teamScore,
            opponentScore,
            'OPP', // Opponent abbreviation
            Math.random() > 0.5, // isHome
            new Date(),
            false // isPlayoff
          );
          
          await team.save();
        }
      }
      
      console.log(`Updated results for week ${currentWeek}`);
      return { success: true, week: currentWeek };
    } catch (error) {
      console.error('Error updating NFL weekly results:', error);
      throw error;
    }
  }

  // Update playoff standings and status
  async updatePlayoffStandings() {
    try {
      console.log('Updating playoff standings...');
      
      const teams = await NFLTeam.find({ isActive: true })
        .sort({ 
          'currentSeason.wins': -1,
          'currentSeason.losses': 1
        });

      // Simulate playoff bracket updates
      const afcTeams = teams.filter(t => t.conference === 'AFC');
      const nfcTeams = teams.filter(t => t.conference === 'NFC');

      // Determine playoff teams (top 7 from each conference)
      const afcPlayoffTeams = afcTeams.slice(0, 7);
      const nfcPlayoffTeams = nfcTeams.slice(0, 7);

      // Update playoff status
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const isAfcPlayoff = afcPlayoffTeams.includes(team);
        const isNfcPlayoff = nfcPlayoffTeams.includes(team);

        if (isAfcPlayoff || isNfcPlayoff) {
          // Simulate different playoff rounds
          if (i < 2) {
            team.currentSeason.playoffStatus = 'superbowl';
          } else if (i < 4) {
            team.currentSeason.playoffStatus = 'conference';
          } else if (i < 8) {
            team.currentSeason.playoffStatus = 'divisional';
          } else {
            team.currentSeason.playoffStatus = 'wildcard';
          }
        } else {
          team.currentSeason.playoffStatus = 'none';
        }

        await team.save();
      }

      console.log('Playoff standings updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating playoff standings:', error);
      throw error;
    }
  }

  // Get current NFL week
  getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart + 1, 1), 18);
  }

  // Fetch live scores (placeholder for real API integration)
  async fetchLiveScores() {
    try {
      // In production, this would call a real-time sports API
      console.log('Fetching live scores...');
      
      const liveGames = [
        {
          homeTeam: 'KC',
          awayTeam: 'BUF',
          homeScore: 21,
          awayScore: 14,
          quarter: 3,
          timeRemaining: '8:42',
          isLive: true
        }
      ];

      return liveGames;
    } catch (error) {
      console.error('Error fetching live scores:', error);
      throw error;
    }
  }

  // Clean up old data
  async cleanupOldData() {
    try {
      console.log('Cleaning up old NFL data...');
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Clean up old weekly results (keep only current and previous season)
      const teams = await NFLTeam.find({ isActive: true });
      
      for (const team of teams) {
        team.weeklyResults = team.weeklyResults.filter(
          result => new Date(result.gameDate) > oneYearAgo
        );
        await team.save();
      }

      console.log('Old data cleanup completed');
      return { success: true };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  // Seed initial NFL team data
  async seedNFLTeams() {
    try {
      console.log('Seeding NFL teams...');
      
      const existingTeams = await NFLTeam.countDocuments();
      if (existingTeams > 0) {
        console.log('NFL teams already exist, skipping seed');
        return;
      }

      const nflTeams = [
        // AFC East
        { name: 'Bills', city: 'Buffalo', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
        { name: 'Dolphins', city: 'Miami', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
        { name: 'Patriots', city: 'New England', abbreviation: 'NE', conference: 'AFC', division: 'East' },
        { name: 'Jets', city: 'New York', abbreviation: 'NYJ', conference: 'AFC', division: 'East' },
        
        // AFC North
        { name: 'Ravens', city: 'Baltimore', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
        { name: 'Bengals', city: 'Cincinnati', abbreviation: 'CIN', conference: 'AFC', division: 'North' },
        { name: 'Browns', city: 'Cleveland', abbreviation: 'CLE', conference: 'AFC', division: 'North' },
        { name: 'Steelers', city: 'Pittsburgh', abbreviation: 'PIT', conference: 'AFC', division: 'North' },
        
        // AFC South
        { name: 'Texans', city: 'Houston', abbreviation: 'HOU', conference: 'AFC', division: 'South' },
        { name: 'Colts', city: 'Indianapolis', abbreviation: 'IND', conference: 'AFC', division: 'South' },
        { name: 'Jaguars', city: 'Jacksonville', abbreviation: 'JAX', conference: 'AFC', division: 'South' },
        { name: 'Titans', city: 'Tennessee', abbreviation: 'TEN', conference: 'AFC', division: 'South' },
        
        // AFC West
        { name: 'Broncos', city: 'Denver', abbreviation: 'DEN', conference: 'AFC', division: 'West' },
        { name: 'Chiefs', city: 'Kansas City', abbreviation: 'KC', conference: 'AFC', division: 'West' },
        { name: 'Raiders', city: 'Las Vegas', abbreviation: 'LV', conference: 'AFC', division: 'West' },
        { name: 'Chargers', city: 'Los Angeles', abbreviation: 'LAC', conference: 'AFC', division: 'West' },
        
        // NFC East
        { name: 'Cowboys', city: 'Dallas', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
        { name: 'Giants', city: 'New York', abbreviation: 'NYG', conference: 'NFC', division: 'East' },
        { name: 'Eagles', city: 'Philadelphia', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
        { name: 'Commanders', city: 'Washington', abbreviation: 'WAS', conference: 'NFC', division: 'East' },
        
        // NFC North
        { name: 'Bears', city: 'Chicago', abbreviation: 'CHI', conference: 'NFC', division: 'North' },
        { name: 'Lions', city: 'Detroit', abbreviation: 'DET', conference: 'NFC', division: 'North' },
        { name: 'Packers', city: 'Green Bay', abbreviation: 'GB', conference: 'NFC', division: 'North' },
        { name: 'Vikings', city: 'Minnesota', abbreviation: 'MIN', conference: 'NFC', division: 'North' },
        
        // NFC South
        { name: 'Falcons', city: 'Atlanta', abbreviation: 'ATL', conference: 'NFC', division: 'South' },
        { name: 'Panthers', city: 'Carolina', abbreviation: 'CAR', conference: 'NFC', division: 'South' },
        { name: 'Saints', city: 'New Orleans', abbreviation: 'NO', conference: 'NFC', division: 'South' },
        { name: 'Buccaneers', city: 'Tampa Bay', abbreviation: 'TB', conference: 'NFC', division: 'South' },
        
        // NFC West
        { name: 'Cardinals', city: 'Arizona', abbreviation: 'ARI', conference: 'NFC', division: 'West' },
        { name: 'Rams', city: 'Los Angeles', abbreviation: 'LAR', conference: 'NFC', division: 'West' },
        { name: 'Seahawks', city: 'Seattle', abbreviation: 'SEA', conference: 'NFC', division: 'West' },
        { name: '49ers', city: 'San Francisco', abbreviation: 'SF', conference: 'NFC', division: 'West' }
      ];

      const teamsWithDefaults = nflTeams.map(team => ({
        ...team,
        colors: {
          primary: '#000000',
          secondary: '#FFFFFF'
        },
        logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbreviation.toLowerCase()}.png`,
        established: 1960,
        stadium: {
          name: `${team.city} Stadium`,
          capacity: 65000,
          location: `${team.city}, USA`
        },
        currentSeason: {
          year: new Date().getFullYear(),
          wins: 0,
          losses: 0,
          ties: 0
        },
        allTimeStats: {
          totalWins: 0,
          totalLosses: 0,
          totalTies: 0,
          playoffAppearances: 0,
          superbowlAppearances: 0,
          superbowlWins: 0,
          divisionTitles: 0
        },
        weeklyResults: [],
        isActive: true
      }));

      await NFLTeam.insertMany(teamsWithDefaults);
      console.log(`Seeded ${teamsWithDefaults.length} NFL teams`);
      
      return { success: true, count: teamsWithDefaults.length };
    } catch (error) {
      console.error('Error seeding NFL teams:', error);
      throw error;
    }
  }
}

module.exports = new NFLDataService();
