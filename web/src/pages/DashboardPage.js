import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchLeagues, 
  selectLeagues, 
  selectLeagueLoading 
} from '../store/slices/leagueSlice';
import { selectUser } from '../store/slices/authSlice';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const leagues = useSelector(selectLeagues);
  const loading = useSelector(selectLeagueLoading);

  useEffect(() => {
    dispatch(fetchLeagues());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your leagues and track your NFL team performance.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 text-white">
                👥
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Leagues
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {leagues.filter(l => l.status === 'active').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                💰
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Winnings
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  ${user?.totalWinnings || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-white">
                🏆
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Teams Owned
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {leagues.reduce((total, league) => {
                    return total + (league.teams?.filter(t => t.owner === user?.id).length || 0);
                  }, 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                📊
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  This Week
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  Week 12
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leagues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Your Leagues</h3>
          </div>
          
          {leagues.length > 0 ? (
            <div className="space-y-4">
              {leagues.slice(0, 5).map((league) => (
                <div key={league._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">{league.name}</h4>
                    <p className="text-sm text-gray-500">
                      {league.memberCount} members • {league.status}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      as={Link}
                      to={`/app/leagues/${league._id}`}
                      size="sm"
                      variant="outline"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <Button
                  as={Link}
                  to="/app/leagues"
                  variant="outline"
                  className="w-full"
                >
                  View All Leagues
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't joined any leagues yet.</p>
              <div className="space-x-4">
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

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="space-y-4">
            <Button
              as={Link}
              to="/app/leagues/create"
              className="w-full"
              size="lg"
            >
              Create New League
            </Button>
            
            <Button
              as={Link}
              to="/app/leagues/join"
              variant="outline"
              className="w-full"
              size="lg"
            >
              Join League with Code
            </Button>
            
            <Button
              as={Link}
              to="/teams"
              variant="outline"
              className="w-full"
              size="lg"
            >
              View NFL Teams
            </Button>
            
            <Button
              as={Link}
              to="/rules"
              variant="ghost"
              className="w-full"
              size="lg"
            >
              Learn the Rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
