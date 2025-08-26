import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import Button from '../components/common/Button';

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Own Your <span className="gradient-text">NFL Team</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Fantasy football reimagined. Auction and own entire NFL teams, not just players. 
              Create leagues, bid on teams, and earn money based on real NFL performance.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isAuthenticated ? (
                <Button as={Link} to="/app/dashboard" size="lg">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/auth/register" size="lg">
                    Get Started
                  </Button>
                  <Button as={Link} to="/auth/login" variant="outline" size="lg">
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Revolutionary Fantasy</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for team ownership
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Own entire NFL teams and earn based on their real-world performance. Create private leagues, 
            participate in live auctions, and compete with friends throughout the season.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  🏈
                </div>
                Team Auctions
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Bid on entire NFL teams in live auctions. Snake draft ensures fair nomination order for all participants.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  💰
                </div>
                Real Money Payouts
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Earn money based on your teams' wins, playoff performance, and Super Bowl success. Automated weekly payouts.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  👥
                </div>
                Private Leagues
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Create private leagues with friends. Customize auction settings, payout structures, and league rules.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  📱
                </div>
                Multi-Platform
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Access your leagues from web, iOS, or Android. Real-time updates and notifications across all devices.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA section */}
      <div className="mx-auto mt-32 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to own your team?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-lg leading-8 text-gray-300">
            Join thousands of NFL fans competing in the most innovative fantasy football experience.
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Button as={Link} to="/auth/register" size="lg" variant="primary">
              Start Playing Now
            </Button>
            <Button as={Link} to="/rules" size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
              Learn the Rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
