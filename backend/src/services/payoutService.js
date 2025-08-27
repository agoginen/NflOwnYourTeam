const League = require('../models/League');
const NFLTeam = require('../models/NFLTeam');
const User = require('../models/User');

class PayoutService {
  // Calculate weekly payouts for all active leagues based on NFL results
  async calculateWeeklyPayouts() {
    try {
      console.log('Calculating weekly payouts...');
      
      const activeLeagues = await League.find({ status: 'active' })
        .populate([
          {
            path: 'teams.nflTeam',
            select: 'name abbreviation city wins losses ties playoffStatus playoffResults'
          },
          {
            path: 'teams.owner',
            select: 'username email'
          }
        ]);

      let totalLeaguesProcessed = 0;
      let totalPayouts = 0;

      for (const league of activeLeagues) {
        const leaguePayout = await this.updateLeagueWeeklyResults(league);
        totalPayouts += leaguePayout;
        totalLeaguesProcessed++;
      }

      console.log(`Processed ${totalLeaguesProcessed} leagues with total payouts: $${totalPayouts}`);
      return { 
        success: true, 
        leaguesProcessed: totalLeaguesProcessed,
        totalPayouts 
      };
    } catch (error) {
      console.error('Error calculating weekly payouts:', error);
      throw error;
    }
  }

  // Update league with latest NFL results and recalculate earnings
  async updateLeagueWeeklyResults(league) {
    try {
      console.log(`Updating results for league: ${league.name}`);
      
      let hasChanges = false;
      const currentWeek = this.getCurrentWeek();

      // Update league week tracking
      if (league.weeklyUpdates.currentWeek < currentWeek) {
        league.weeklyUpdates.currentWeek = currentWeek;
        league.weeklyUpdates.lastUpdateDate = new Date();
        hasChanges = true;
      }

      // Update team records from NFL API data
      for (const teamData of league.teams) {
        if (!teamData.owner) continue; // Skip unowned teams

        const nflTeam = teamData.nflTeam;
        const previousWins = teamData.seasonStats.wins;
        
        // Update team record
        if (nflTeam.wins !== teamData.seasonStats.wins ||
            nflTeam.losses !== teamData.seasonStats.losses ||
            nflTeam.ties !== teamData.seasonStats.ties) {
          
          league.updateTeamRecord(nflTeam._id, nflTeam.wins, nflTeam.losses, nflTeam.ties);
          hasChanges = true;
          
          const newWins = nflTeam.wins - previousWins;
          if (newWins > 0) {
            console.log(`${teamData.owner.username}'s ${nflTeam.city} ${nflTeam.name} earned ${newWins} new wins`);
          }
        }

        // Update playoff results
        if (nflTeam.playoffResults) {
          const playoffUpdates = this.checkPlayoffUpdates(teamData.seasonStats.playoffResults, nflTeam.playoffResults);
          
          for (const update of playoffUpdates) {
            league.updateTeamPlayoffResult(nflTeam._id, update.type, true);
            hasChanges = true;
            console.log(`${teamData.owner.username}'s ${nflTeam.city} ${nflTeam.name} advanced in playoffs: ${update.type}`);
          }
        }
      }

      // Recalculate all earnings if there were changes
      if (hasChanges) {
        league.recalculateAllEarnings();
        await league.save();
        
        // Update user total winnings
        for (const teamData of league.teams) {
          if (teamData.owner && teamData.currentEarnings > 0) {
            await User.findByIdAndUpdate(teamData.owner._id, {
              $set: { 
                [`leagueWinnings.${league._id}`]: teamData.currentEarnings
              }
            });
          }
        }
      }

      const totalNewEarnings = league.teams.reduce((sum, team) => sum + team.currentEarnings, 0);
      return totalNewEarnings;
    } catch (error) {
      console.error(`Error updating league ${league.name}:`, error);
      throw error;
    }
  }

  // Check for new playoff advancement
  checkPlayoffUpdates(currentResults, nflResults) {
    const updates = [];
    
    const checkAndAdd = (type, current, nfl) => {
      if (!current && nfl) {
        updates.push({ type });
      }
    };

    checkAndAdd('wildCardWin', currentResults.wildCardWin, nflResults.wildCardWin);
    checkAndAdd('divisionalWin', currentResults.divisionalWin, nflResults.divisionalWin);
    checkAndAdd('conferenceChampionshipWin', currentResults.conferenceChampionshipWin, nflResults.conferenceChampionshipWin);
    checkAndAdd('superBowlAppearance', currentResults.superBowlAppearance, nflResults.superBowlAppearance);
    checkAndAdd('superBowlWin', currentResults.superBowlWin, nflResults.superBowlWin);

    return updates;
  }

  // Get league payout summary with detailed breakdown
  async getLeaguePayoutSummary(leagueId) {
    try {
      const league = await League.findById(leagueId)
        .populate([
          {
            path: 'teams.nflTeam',
            select: 'name abbreviation city wins losses ties playoffStatus'
          },
          {
            path: 'teams.owner',
            select: 'username firstName lastName email'
          }
        ]);

      if (!league) {
        throw new Error('League not found');
      }

      const summary = {
        league: {
          id: league._id,
          name: league.name,
          totalPrizePool: league.totalPrizePool,
          distributedWinnings: league.distributedWinnings,
          remainingPool: league.totalPrizePool - league.distributedWinnings,
          currentWeek: league.weeklyUpdates.currentWeek,
          lastUpdate: league.weeklyUpdates.lastUpdateDate
        },
        payoutStructure: league.payoutStructure,
        ownerStandings: [],
        teamDetails: []
      };

      // Group teams by owner
      const ownerMap = new Map();
      
      league.teams.forEach(team => {
        if (team.owner) {
          const ownerId = team.owner._id.toString();
          
          if (!ownerMap.has(ownerId)) {
            ownerMap.set(ownerId, {
              owner: team.owner,
              totalInvestment: 0,
              totalEarnings: 0,
              teams: [],
              netProfit: 0,
              roi: 0
            });
          }
          
          const ownerData = ownerMap.get(ownerId);
          ownerData.totalInvestment += team.purchasePrice;
          ownerData.totalEarnings += team.currentEarnings;
          ownerData.teams.push({
            nflTeam: team.nflTeam,
            purchasePrice: team.purchasePrice,
            currentEarnings: team.currentEarnings,
            seasonStats: team.seasonStats,
            profit: team.currentEarnings - team.purchasePrice
          });
        }

        // Add to team details
        summary.teamDetails.push({
          nflTeam: team.nflTeam,
          owner: team.owner,
          purchasePrice: team.purchasePrice,
          currentEarnings: team.currentEarnings,
          seasonStats: team.seasonStats,
          earningsBreakdown: team.seasonStats.earnings
        });
      });

      // Calculate final owner standings
      summary.ownerStandings = Array.from(ownerMap.values())
        .map(owner => {
          owner.netProfit = owner.totalEarnings - owner.totalInvestment;
          owner.roi = owner.totalInvestment > 0 
            ? (owner.netProfit / owner.totalInvestment * 100) 
            : 0;
          return owner;
        })
        .sort((a, b) => b.totalEarnings - a.totalEarnings);

      return summary;
    } catch (error) {
      console.error('Error getting league payout summary:', error);
      throw error;
    }
  }

  // Finalize season and complete league
  async finalizeSeasonPayouts(leagueId) {
    try {
      const league = await League.findById(leagueId)
        .populate([
          {
            path: 'teams.nflTeam',
            select: 'name abbreviation city playoffStatus'
          },
          {
            path: 'teams.owner',
            select: 'username email'
          }
        ]);

      if (!league) {
        throw new Error('League not found');
      }

      // Perform final recalculation including top teams split
      league.recalculateAllEarnings();
      
      // Mark league as completed
      league.status = 'completed';
      league.distributedWinnings = league.teams.reduce((sum, team) => sum + team.currentEarnings, 0);
      
      await league.save();

      // Update all user records with final winnings
      for (const teamData of league.teams) {
        if (teamData.owner && teamData.currentEarnings > 0) {
          await User.findByIdAndUpdate(teamData.owner._id, {
            $set: { 
              [`leagueWinnings.${league._id}`]: teamData.currentEarnings
            },
            $inc: {
              totalWinnings: teamData.currentEarnings
            }
          });
        }
      }

      console.log(`Season finalized for league: ${league.name}`);
      console.log(`Total prize pool: $${league.totalPrizePool}`);
      console.log(`Total distributed: $${league.distributedWinnings}`);

      return {
        success: true,
        leagueId: league._id,
        totalPrizePool: league.totalPrizePool,
        totalDistributed: league.distributedWinnings,
        finalStandings: await this.getLeaguePayoutSummary(leagueId)
      };
    } catch (error) {
      console.error('Error finalizing season payouts:', error);
      throw error;
    }
  }

  // Get current week number based on NFL season
  getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    
    // NFL season typically starts first Thursday of September
    const seasonStart = new Date(year, 8, 1); // September 1st approximation
    const firstThursday = new Date(seasonStart);
    const dayOfWeek = seasonStart.getDay();
    const daysToThursday = (4 - dayOfWeek + 7) % 7;
    firstThursday.setDate(seasonStart.getDate() + daysToThursday);
    
    if (now < firstThursday) {
      // Pre-season
      return 0;
    }
    
    const weeksSinceStart = Math.floor((now - firstThursday) / (7 * 24 * 60 * 60 * 1000));
    
    // Regular season: weeks 1-18, Playoffs: weeks 19-22
    return Math.min(Math.max(weeksSinceStart + 1, 1), 22);
  }

  // Validate payout structure totals
  validatePayoutStructure(payoutStructure) {
    const basePercentages = [
      payoutStructure.regularSeasonWins,
      payoutStructure.wildCardWin,
      payoutStructure.divisionalWin,
      payoutStructure.conferenceChampionshipWin,
      payoutStructure.superBowlAppearance,
      payoutStructure.superBowlWin
    ];
    
    let totalPercentage = basePercentages.reduce((sum, val) => sum + (val || 0), 0);
    
    if (payoutStructure.topTeamsSplit && payoutStructure.topTeamsSplit.enabled) {
      totalPercentage += payoutStructure.topTeamsSplit.percentage;
    }
    
    if (totalPercentage > 100) {
      throw new Error(`Total payout percentage (${totalPercentage.toFixed(1)}%) cannot exceed 100%`);
    }

    if (totalPercentage < 80) {
      console.warn(`Payout structure only uses ${totalPercentage.toFixed(1)}% of prize pool`);
    }

    return { 
      isValid: true, 
      totalPercentage: totalPercentage,
      unusedPercentage: 100 - totalPercentage
    };
  }

  // Calculate estimated payouts for preview
  calculatePayoutPreview(league) {
    const totalPool = league.totalPrizePool;
    const structure = league.payoutStructure;
    
    // Estimate total regular season wins (approximately 272 total wins in NFL season)
    const estimatedTotalWins = 272;
    const winValue = (totalPool * structure.regularSeasonWins / 100) / estimatedTotalWins;
    
    return {
      regularSeasonWinValue: winValue.toFixed(2),
      playoffPayouts: {
        wildCard: (totalPool * structure.wildCardWin / 100).toFixed(2),
        divisional: (totalPool * structure.divisionalWin / 100).toFixed(2),
        conference: (totalPool * structure.conferenceChampionshipWin / 100).toFixed(2),
        superBowlAppearance: (totalPool * structure.superBowlAppearance / 100).toFixed(2),
        superBowlWin: (totalPool * structure.superBowlWin / 100).toFixed(2)
      },
      topTeamsSplit: structure.topTeamsSplit.enabled 
        ? (totalPool * structure.topTeamsSplit.percentage / 100 / structure.topTeamsSplit.numberOfTeams).toFixed(2)
        : 0
    };
  }
}

module.exports = new PayoutService();
