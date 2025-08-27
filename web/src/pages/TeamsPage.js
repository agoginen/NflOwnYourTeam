import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  fetchNFLTeams,
  selectNFLTeams,
  selectTeamsByConference,
  selectNFLLoading,
  selectNFLError,
  clearError
} from '../store/slices/nflSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

const TeamsPage = () => {
  const dispatch = useDispatch();
  const teams = useSelector(selectNFLTeams);
  const teamsByConference = useSelector(selectTeamsByConference);
  const loading = useSelector(selectNFLLoading);
  const error = useSelector(selectNFLError);

  const [selectedConference, setSelectedConference] = useState('all');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchNFLTeams());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConference = selectedConference === 'all' || team.conference === selectedConference;
    const matchesDivision = selectedDivision === 'all' || team.division === selectedDivision;
    
    return matchesSearch && matchesConference && matchesDivision;
  });

  const divisions = ['all', 'North', 'South', 'East', 'West'];

  if (loading) {
    return <LoadingSpinner text="Loading NFL teams..." />;
  }

  const TeamCard = ({ team }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img
            src={team.logo}
            alt={`${team.city} ${team.name}`}
            className="w-16 h-16 object-contain"
          />
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {team.city} {team.name}
        </h3>
        
        <div className="text-sm text-gray-600 mb-3">
          {team.conference} {team.division}
        </div>

        {team.primaryColor && (
          <div className="flex justify-center items-center mb-3">
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-200"
              style={{ backgroundColor: team.primaryColor }}
            ></div>
            {team.secondaryColor && (
              <div
                className="w-6 h-6 rounded-full border-2 border-gray-200 ml-1"
                style={{ backgroundColor: team.secondaryColor }}
              ></div>
            )}
          </div>
        )}

        {team.stats && (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="font-semibold">W-L:</span> {team.stats.wins}-{team.stats.losses}
            </div>
            <div>
              <span className="font-semibold">Conference:</span> {team.stats.conferenceRank || 'N/A'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const TeamListItem = ({ team }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 mb-3"
    >
      <div className="flex items-center space-x-4">
        <img
          src={team.logo}
          alt={`${team.city} ${team.name}`}
          className="w-12 h-12 object-contain"
        />
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {team.city} {team.name}
          </h3>
          <p className="text-sm text-gray-600">
            {team.conference} {team.division}
          </p>
        </div>

        {team.stats && (
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {team.stats.wins}-{team.stats.losses}
            </div>
            <div className="text-xs text-gray-500">
              Rank: {team.stats.conferenceRank || 'N/A'}
            </div>
          </div>
        )}

        {team.primaryColor && (
          <div className="flex space-x-1">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: team.primaryColor }}
            ></div>
            {team.secondaryColor && (
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: team.secondaryColor }}
              ></div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const ConferenceSection = ({ conference, divisions }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {conference} Conference
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(divisions).map(([division, divisionTeams]) => (
          <div key={division} className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              {conference} {division}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {divisionTeams.map(team => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">NFL Teams</h1>
          <p className="text-lg text-gray-600">
            Explore all 32 National Football League teams
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Teams
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by city or team name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Conference Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conference
              </label>
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Conferences</option>
                <option value="AFC">AFC</option>
                <option value="NFC">NFC</option>
              </select>
            </div>

            {/* Division Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {divisions.map(division => (
                  <option key={division} value={division}>
                    {division === 'all' ? 'All Divisions' : division}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Mode
              </label>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  Grid
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredTeams.length} of {teams.length} teams
          </div>
        </div>

        {/* Teams Display */}
        {searchTerm || selectedConference !== 'all' || selectedDivision !== 'all' ? (
          // Filtered Results
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'Filtered Teams'}
            </h2>
            
            {filteredTeams.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredTeams.map(team => (
                    <TeamCard key={team._id} team={team} />
                  ))}
                </div>
              ) : (
                <div>
                  {filteredTeams.map(team => (
                    <TeamListItem key={team._id} team={team} />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        ) : (
          // Conference View
          <div>
            {Object.entries(teamsByConference).map(([conference, divisions]) => (
              <ConferenceSection
                key={conference}
                conference={conference}
                divisions={divisions}
              />
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">32</div>
              <div className="text-sm text-gray-600">Total Teams</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">2</div>
              <div className="text-sm text-gray-600">Conferences</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">8</div>
              <div className="text-sm text-gray-600">Divisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">17</div>
              <div className="text-sm text-gray-600">Regular Season Games</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
