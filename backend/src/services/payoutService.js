const League = require('../models/League');
const NFLTeam = require('../models/NFLTeam');
const User = require('../models/User');

class PayoutService {
  // Calculate weekly payouts for all active leagues
  async calculateWeeklyPayouts() {
    try {
      console.log('Calculating weekly payouts...');
      
      const activeLeagues = await League.find({ status: 'active' })
        .populate([
          {
            path: 'teams.nflTeam',
            select: 'name abbreviation currentSeason weeklyResults'
          },
          {
            path: 'teams.owner',
            select: 'username'
          }
        ]);

      for (const league of activeLeagues) {
        await this.calculateLeaguePayouts(league);
      }

      console.log(`Calculated payouts for ${activeLeagues.length} leagues`);
      return { success: true, leaguesProcessed: activeLeagues.length };
    } catch (error) {
      console.error('Error calculating weekly payouts:', error);
      throw error;
    }
  }

  // Calculate payouts for a specific league
  async calculateLeaguePayouts(league) {
    try {
      const currentWeek = this.getCurrentWeek();
      let totalNewEarnings = 0;

      // Process each team in the league
      for (const teamData of league.teams) {
        if (!teamData.owner) continue; // Skip unowned teams

        const nflTeam = teamData.nflTeam;
        const weeklyEarnings = this.calculateTeamWeeklyEarnings(
          nflTeam,
          league.payoutStructure,
          league.totalPrizePool,
          currentWeek
        );

        if (weeklyEarnings > 0) {
          // Update team earnings
          teamData.currentEarnings += weeklyEarnings;
          totalNewEarnings += weeklyEarnings;

          // Update user's total winnings
          await User.findByIdAndUpdate(teamData.owner._id, {
            $inc: { totalWinnings: weeklyEarnings }
          });

          console.log(`${teamData.owner.username} earned $${weeklyEarnings} from ${nflTeam.name}`);
        }
      }

      // Update league distributed winnings
      league.distributedWinnings += totalNewEarnings;
      await league.save();

      return totalNewEarnings;
    } catch (error) {
      console.error(`Error calculating payouts for league ${league.name}:`, error);
      throw error;
    }
  }

  // Calculate earnings for a specific team based on their performance
  calculateTeamWeeklyEarnings(nflTeam, payoutStructure, totalPrizePool, currentWeek) {
    let earnings = 0;
    const { payoutStructure: payout } = payoutStructure;

    // Regular season win earnings
    const lastWeekResult = nflTeam.weeklyResults.find(
      result => result.week === currentWeek - 1 && !result.isPlayoff && result.result === 'W'
    );

    if (lastWeekResult) {
      earnings += (totalPrizePool * payout.regularSeasonWin) / 100;
    }

    // Playoff earnings
    const playoffResult = nflTeam.weeklyResults.find(
      result => result.week === currentWeek - 1 && result.isPlayoff && result.result === 'W'
    );

    if (playoffResult) {
      switch (playoffResult.playoffRound) {
        case 'wildcard':
          earnings += (totalPrizePool * payout.wildCardWin) / 100;
          break;
        case 'divisional':
          earnings += (totalPrizePool * payout.divisionalWin) / 100;
          break;
        case 'conference':
          earnings += (totalPrizePool * payout.conferenceChampionshipWin) / 100;
          break;
        case 'superbowl':
          if (playoffResult.result === 'W') {
            earnings += (totalPrizePool * payout.superBowlWin) / 100;
          } else {
            earnings += (totalPrizePool * payout.superBowlAppearance) / 100;
          }
          break;
      }
    }

    // Super Bowl appearance bonus (separate from win)
    if (nflTeam.currentSeason.playoffStatus === 'superbowl') {
      earnings += (totalPrizePool * payout.superBowlAppearance) / 100;
    }

    return Math.round(earnings * 100) / 100; // Round to 2 decimal places
  }

  // Calculate season-end payouts
  async calculateSeasonEndPayouts(leagueId) {
    try {
      const league = await League.findById(leagueId)
        .populate([
          {
            path: 'teams.nflTeam',
            select: 'name abbreviation currentSeason'
          },
          {
            path: 'teams.owner',
            select: 'username'
          }
        ]);

      if (!league) {
        throw new Error('League not found');
      }

      const { payoutStructure, totalPrizePool } = league;
      let totalSeasonEndPayouts = 0;

      // Award Super Bowl winner bonus
      const superBowlWinner = league.teams.find(team => 
        team.nflTeam.currentSeason.playoffStatus === 'champion'
      );

      if (superBowlWinner && superBowlWinner.owner) {
        const winnerBonus = (totalPrizePool * payoutStructure.superBowlWin) / 100;
        superBowlWinner.currentEarnings += winnerBonus;
        totalSeasonEndPayouts += winnerBonus;

        await User.findByIdAndUpdate(superBowlWinner.owner._id, {
          $inc: { totalWinnings: winnerBonus }
        });

        console.log(`Super Bowl winner ${superBowlWinner.owner.username} earned bonus: $${winnerBonus}`);
      }

      // Calculate any remaining distributable amount
      const remainingAmount = totalPrizePool - league.distributedWinnings - totalSeasonEndPayouts;
      
      if (remainingAmount > 0) {
        // Distribute remaining amount proportionally based on regular season performance
        const totalWins = league.teams.reduce((sum, team) => 
          sum + (team.nflTeam.currentSeason.wins || 0), 0
        );

        if (totalWins > 0) {
          for (const teamData of league.teams) {
            if (teamData.owner && teamData.nflTeam.currentSeason.wins > 0) {
              const winPercentage = teamData.nflTeam.currentSeason.wins / totalWins;
              const bonusEarnings = remainingAmount * winPercentage;
              
              teamData.currentEarnings += bonusEarnings;
              totalSeasonEndPayouts += bonusEarnings;

              await User.findByIdAndUpdate(teamData.owner._id, {
                $inc: { totalWinnings: bonusEarnings }
              });
            }
          }
        }
      }

      // Update league
      league.distributedWinnings += totalSeasonEndPayouts;
      league.status = 'completed';
      await league.save();

      return {
        success: true,
        totalPaidOut: totalSeasonEndPayouts,
        finalDistribution: league.distributedWinnings
      };
    } catch (error) {
      console.error('Error calculating season end payouts:', error);
      throw error;
    }
  }

  // Get payout summary for a league
  async getLeaguePayoutSummary(leagueId) {
    try {
      const league = await League.findById(leagueId)
        .populate([
          {
            path: 'teams.nflTeam',
            select: 'name abbreviation currentSeason'
          },
          {
            path: 'teams.owner',
            select: 'username firstName lastName'
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
          remainingPool: league.totalPrizePool - league.distributedWinnings
        },
        payoutStructure: league.payoutStructure,
        teamEarnings: []
      };

      // Calculate earnings by owner
      const ownerEarnings = {};
      
      league.teams.forEach(team => {
        if (team.owner) {
          const ownerId = team.owner._id.toString();
          if (!ownerEarnings[ownerId]) {
            ownerEarnings[ownerId] = {
              owner: team.owner,
              totalEarnings: 0,
              teams: [],
              roi: 0 // Return on investment
            };
          }
          
          ownerEarnings[ownerId].totalEarnings += team.currentEarnings;
          ownerEarnings[ownerId].teams.push({
            nflTeam: team.nflTeam,
            purchasePrice: team.purchasePrice,
            currentEarnings: team.currentEarnings,
            profit: team.currentEarnings - team.purchasePrice
          });
        }
      });

      // Calculate ROI and sort by total earnings
      summary.teamEarnings = Object.values(ownerEarnings)
        .map(owner => {
          const totalInvestment = owner.teams.reduce((sum, team) => sum + team.purchasePrice, 0);
          owner.roi = totalInvestment > 0 ? ((owner.totalEarnings - totalInvestment) / totalInvestment * 100) : 0;
          return owner;
        })
        .sort((a, b) => b.totalEarnings - a.totalEarnings);

      return summary;
    } catch (error) {
      console.error('Error getting league payout summary:', error);
      throw error;
    }
  }

  // Get current week number
  getCurrentWeek() {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1st
    const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart + 1, 1), 22);
  }

  // Validate payout structure
  validatePayoutStructure(payoutStructure) {
    const totalPercentage = Object.values(payoutStructure).reduce((sum, val) => sum + val, 0);
    
    if (totalPercentage > 100) {
      throw new Error('Total payout percentage cannot exceed 100%');
    }

    if (totalPercentage < 50) {
      console.warn('Payout structure uses less than 50% of prize pool');
    }

    return { isValid: true, totalPercentage };
  }
}

module.exports = new PayoutService();
