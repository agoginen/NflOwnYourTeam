import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeagues, selectLeagues, selectLeagueLoading } from '../../store/slices/leagueSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LeaguesPage = () => {
  const dispatch = useDispatch();
  const leagues = useSelector(selectLeagues);
  const loading = useSelector(selectLeagueLoading);

  useEffect(() => {
    dispatch(fetchLeagues());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner text="Loading your leagues..." />;
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Leagues</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your fantasy leagues and track your team performance.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-3">
            <Button as={Link} to="/app/leagues/join" variant="outline">
              Join League
            </Button>
            <Button as={Link} to="/app/leagues/create">
              Create League
            </Button>
          </div>
        </div>
      </div>

      {leagues.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <div key={league._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {league.name}
                </h3>
                <span className={`badge ${
                  league.status === 'active' ? 'badge-success' :
                  league.status === 'auction' ? 'badge-warning' :
                  league.status === 'draft' ? 'badge-secondary' :
                  'badge-danger'
                }`}>
                  {league.status}
                </span>
              </div>
              
              {league.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {league.description}
                </p>
              )}
              
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>{league.memberCount} members</span>
                <span>Code: {league.inviteCode}</span>
              </div>
              
              <div className="mt-4 flex space-x-3">
                <Button
                  as={Link}
                  to={`/app/leagues/${league._id}`}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  View Details
                </Button>
                {league.auction && (
                  <Button
                    as={Link}
                    to={`/app/auctions/${league.auction?._id || league.auction}`}
                    size="sm"
                    className="flex-1"
                  >
                    Join Auction
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            👥
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leagues</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a league or joining one with an invite code.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button as={Link} to="/app/leagues/create">
              Create League
            </Button>
            <Button as={Link} to="/app/leagues/join" variant="outline">
              Join League
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaguesPage;
