import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  fetchLeague,
  selectCurrentLeague,
  selectLeagueLoading
} from '../store/slices/leagueSlice';
import { fetchNFLStandings, selectNFLStandings } from '../store/slices/nflSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const StandingsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const league = useSelector(selectCurrentLeague);
  const nflStandings = useSelector(selectNFLStandings);
  const loading = useSelector(selectLeagueLoading);

  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState('fantasy'); // 'fantasy' or 'nfl'

  useEffect(() => {
    if (id) {
      dispatch(fetchLeague(id));
    }
    dispatch(fetchNFLStandings());
  }, [dispatch, id]);

  if (loading) {
    return <LoadingSpinner text="Loading standings..." />;
  }

  if (!league && id) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">League not found</h3>
        <p className="text-gray-500">The requested league could not be found.</p>
      </div>
    );
  }

  // Calculate fantasy standings based on new earnings system
  const calculateFantasyStandings = () => {
    if (!league?.teams) return [];
    
    // Group teams by owner
    const ownerMap = new Map();
    
    league.teams.forEach(team => {
      if (team.owner) {
        const ownerId = team.owner._id || team.owner;
        
        if (!ownerMap.has(ownerId)) {
          ownerMap.set(ownerId, {
            owner: team.owner,
            ownedTeams: [],
            totalWins: 0,
            totalLosses: 0,
            totalTies: 0,
            totalSpent: 0,
            totalEarnings: 0,
            netProfit: 0,
            roi: 0,
            playoffTeams: 0
          });
        }
        
        const ownerData = ownerMap.get(ownerId);
        ownerData.ownedTeams.push(team);
        ownerData.totalWins += team.seasonStats?.wins || 0;
        ownerData.totalLosses += team.seasonStats?.losses || 0;
        ownerData.totalTies += team.seasonStats?.ties || 0;
        ownerData.totalSpent += team.purchasePrice || 0;
        ownerData.totalEarnings += team.currentEarnings || 0;
        
        // Count playoff teams
        if (team.seasonStats?.playoffResults) {
          const playoffResults = team.seasonStats.playoffResults;
          if (playoffResults.wildCardWin || playoffResults.divisionalWin || 
              playoffResults.conferenceChampionshipWin || playoffResults.superBowlAppearance) {
            ownerData.playoffTeams++;
          }
        }
      }
    });
    
    // Calculate derived stats and sort
    return Array.from(ownerMap.values())
      .map(owner => {
        owner.netProfit = owner.totalEarnings - owner.totalSpent;
        owner.roi = owner.totalSpent > 0 ? (owner.netProfit / owner.totalSpent * 100) : 0;
        owner.winPercentage = (owner.totalWins + owner.totalLosses + owner.totalTies) > 0 ? 
          owner.totalWins / (owner.totalWins + owner.totalLosses + owner.totalTies) : 0;
        return owner;
      })
      .sort((a, b) => {
        // Sort by total earnings first, then by ROI
        if (b.totalEarnings !== a.totalEarnings) {
          return b.totalEarnings - a.totalEarnings;
        }
        return b.roi - a.roi;
      });
  };

  const fantasyStandings = calculateFantasyStandings();

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  const FantasyStandingsTable = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {league.name} Fantasy Standings
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teams Owned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Record (W-L-T)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Earnings
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Profit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROI %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fantasyStandings.map((member, index) => (
              <motion.tr
                key={member._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`hover:bg-gray-50 ${index === 0 ? 'bg-yellow-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      index === 0 ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      #{index + 1}
                    </span>
                    {index === 0 && <span className="ml-1 text-yellow-500">👑</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {member.owner.username}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.owner.firstName} {member.owner.lastName}
                  </div>
                  {member.playoffTeams > 0 && (
                    <div className="text-xs text-blue-600 font-semibold">
                      {member.playoffTeams} playoff team{member.playoffTeams !== 1 ? 's' : ''}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {member.ownedTeams.slice(0, 4).map(team => (
                      <div key={team._id} className="relative">
                        <img
                          src={team.nflTeam.logo}
                          alt={team.nflTeam.name}
                          className="w-6 h-6 object-contain"
                          title={`${team.nflTeam.city} ${team.nflTeam.name} - $${team.currentEarnings.toLocaleString()}`}
                          onError={(e) => {
                            e.target.outerHTML = `<div class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded border text-xs font-bold text-gray-600" title="${team.nflTeam.city} ${team.nflTeam.name}">${team.nflTeam.abbreviation}</div>`;
                          }}
                        />
                        {team.currentEarnings > 0 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </div>
                    ))}
                    {member.ownedTeams.length > 4 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{member.ownedTeams.length - 4}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {member.ownedTeams.length} teams
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {member.totalWins}-{member.totalLosses}
                    {member.totalTies > 0 && `-${member.totalTies}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(member.winPercentage * 100).toFixed(1)}% win rate
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${member.totalSpent.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    ${member.totalEarnings.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    member.netProfit > 0 ? 'text-green-600' : 
                    member.netProfit < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    ${member.netProfit.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    member.roi > 0 ? 'text-green-600' : 
                    member.roi < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {member.roi.toFixed(1)}%
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const NFLStandingsTable = () => {
    if (!nflStandings) return null;

    return (
      <div className="space-y-8">
        {Object.entries(nflStandings).map(([conference, divisions]) => (
          <div key={conference} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {conference} Conference
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {Object.entries(divisions).map(([division, teams]) => (
                <div key={division} className="border-r border-gray-200 last:border-r-0">
                  <div className="px-6 py-3 bg-gray-25 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">{conference} {division}</h4>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {teams.map((team, index) => (
                      <div key={team._id} className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 w-4">
                            {index + 1}
                          </span>
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.outerHTML = `<div class="w-6 h-6 flex items-center justify-center bg-gray-100 rounded border text-xs font-bold text-gray-600">${team.abbreviation}</div>`;
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {team.city} {team.name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {team.wins}-{team.losses}
                          {team.ties > 0 && `-${team.ties}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {league ? `${league.name} Standings` : 'NFL Standings'}
          </h1>
          <p className="text-gray-600">
            {viewMode === 'fantasy' 
              ? 'Fantasy league standings based on NFL team performance'
              : 'Official NFL standings by conference and division'
            }
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            
            {/* View Mode Toggle */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setViewMode('fantasy')}
                variant={viewMode === 'fantasy' ? 'primary' : 'outline'}
                disabled={!league}
              >
                Fantasy Standings
              </Button>
              <Button
                onClick={() => setViewMode('nfl')}
                variant={viewMode === 'nfl' ? 'primary' : 'outline'}
              >
                NFL Standings
              </Button>
            </div>

            {/* Week Selector */}
            {viewMode === 'fantasy' && (
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">
                  Week:
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="current">Current</option>
                  {weeks.map(week => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Standings Content */}
        {viewMode === 'fantasy' ? (
          league ? (
            <div className="space-y-8">
              <FantasyStandingsTable />
              
              {/* League Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  League Statistics
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      ${(league.totalPrizePool || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Prize Pool</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${(league.distributedWinnings || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Earnings Distributed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {fantasyStandings.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Owners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {league.teams?.filter(t => t.owner).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Teams Owned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {league.weeklyUpdates?.currentWeek || 0}
                    </div>
                    <div className="text-sm text-gray-600">Current Week</div>
                  </div>
                </div>
                
                {/* Payout Structure Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Regular Season</h4>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Win Payouts:</span>
                        <span>{league.payoutStructure?.regularSeasonWins || 0}% of pool</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Shared across all wins (~{((league.totalPrizePool || 0) * (league.payoutStructure?.regularSeasonWins || 0) / 100 / 272).toFixed(0)} per win)
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Playoffs</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Wild Card:</span>
                        <span>{league.payoutStructure?.wildCardWin || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Divisional:</span>
                        <span>{league.payoutStructure?.divisionalWin || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conference:</span>
                        <span>{league.payoutStructure?.conferenceChampionshipWin || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Super Bowl:</span>
                        <span>{(league.payoutStructure?.superBowlAppearance || 0) + (league.payoutStructure?.superBowlWin || 0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No League Selected
              </h3>
              <p className="text-gray-500 mb-4">
                To view fantasy standings, navigate to a specific league
              </p>
            </div>
          )
        ) : (
          <NFLStandingsTable />
        )}
      </div>
    </div>
  );
};

export default StandingsPage;
