import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  fetchLeagueById,
  selectCurrentLeague,
  selectLeagueLoading,
  selectLeagueError
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
  const error = useSelector(selectLeagueError);

  const [selectedWeek, setSelectedWeek] = useState('current');
  const [viewMode, setViewMode] = useState('fantasy'); // 'fantasy' or 'nfl'

  useEffect(() => {
    if (id) {
      dispatch(fetchLeagueById(id));
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

  // Calculate fantasy standings
  const calculateFantasyStandings = () => {
    if (!league?.members) return [];
    
    return league.members.map(member => {
      const ownedTeams = league.teams?.filter(team => team.owner === member._id) || [];
      const totalWins = ownedTeams.reduce((sum, team) => sum + (team.nflTeam.stats?.wins || 0), 0);
      const totalLosses = ownedTeams.reduce((sum, team) => sum + (team.nflTeam.stats?.losses || 0), 0);
      const totalTies = ownedTeams.reduce((sum, team) => sum + (team.nflTeam.stats?.ties || 0), 0);
      const winPercentage = totalWins + totalLosses + totalTies > 0 ? 
        totalWins / (totalWins + totalLosses + totalTies) : 0;
      
      return {
        ...member,
        ownedTeams,
        totalWins,
        totalLosses,
        totalTies,
        winPercentage,
        totalSpent: ownedTeams.reduce((sum, team) => sum + (team.purchasePrice || 0), 0),
        weeklyEarnings: member.weeklyEarnings || 0
      };
    }).sort((a, b) => {
      // Sort by win percentage, then by total wins
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.totalWins - a.totalWins;
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
                Win %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weekly Earnings
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
                    {member.username}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.firstName} {member.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {member.ownedTeams.slice(0, 4).map(team => (
                      <img
                        key={team._id}
                        src={team.nflTeam.logo}
                        alt={team.nflTeam.name}
                        className="w-6 h-6 object-contain"
                        title={`${team.nflTeam.city} ${team.nflTeam.name}`}
                      />
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(member.winPercentage * 100).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${member.totalSpent.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    member.weeklyEarnings > 0 ? 'text-green-600' : 
                    member.weeklyEarnings < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    ${member.weeklyEarnings.toLocaleString()}
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
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {league.members?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Owners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {league.teams?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Teams Owned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      ${league.totalPayout?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Payout</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {league.currentWeek || 1}
                    </div>
                    <div className="text-sm text-gray-600">Current Week</div>
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
