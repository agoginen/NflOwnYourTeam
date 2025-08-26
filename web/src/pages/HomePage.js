import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';


const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-bounce-gentle"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-white/5 text-6xl animate-bounce-gentle" style={{animationDelay: '0.5s'}}>🏈</div>
        <div className="absolute top-1/3 right-20 text-white/5 text-5xl animate-pulse-slow" style={{animationDelay: '1.5s'}}>🏆</div>
        <div className="absolute bottom-20 left-20 text-white/5 text-4xl animate-bounce-gentle" style={{animationDelay: '2.5s'}}>⚡</div>
        <div className="absolute top-2/3 right-10 text-white/5 text-5xl animate-pulse-slow" style={{animationDelay: '3.5s'}}>🎯</div>
        <div className="absolute bottom-1/4 right-1/3 text-white/5 text-4xl animate-bounce-gentle" style={{animationDelay: '4s'}}>💰</div>
        <div className="absolute top-1/5 right-1/2 text-white/5 text-3xl animate-pulse-slow" style={{animationDelay: '5s'}}>🏟️</div>
      </div>

      {/* NFL field pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.1) 35px,
            rgba(255,255,255,0.1) 40px
          )`
        }}></div>
      </div>

      {/* Hero section */}
      <div className="relative z-10 px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="text-center animate-fade-in">
            {/* Animated logo area */}
            <div className="flex justify-center items-center mb-8">
              <div className="flex space-x-3">
                <span className="text-4xl animate-bounce-gentle" style={{animationDelay: '0.1s'}}>🏈</span>
                <span className="text-4xl animate-bounce-gentle" style={{animationDelay: '0.2s'}}>🏆</span>
                <span className="text-4xl animate-bounce-gentle" style={{animationDelay: '0.3s'}}>💰</span>
                <span className="text-4xl animate-bounce-gentle" style={{animationDelay: '0.4s'}}>👑</span>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6 animate-slide-up">
              <span className="block">Own Your</span>
              <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
                NFL Team
              </span>
            </h1>
            
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <p className="text-xl leading-8 text-blue-100 mb-4">
                🚀 <strong className="text-yellow-400">Fantasy Football Revolutionized</strong> 🚀
              </p>
              <p className="text-lg leading-8 text-blue-200">
                Auction and own <span className="text-yellow-400 font-bold">entire NFL teams</span>, not just players. 
                Create leagues, dominate auctions, and earn <span className="text-green-400 font-bold">real money</span> based on NFL performance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{animationDelay: '0.4s'}}>
              {isAuthenticated ? (
                <button 
                  className="group relative px-8 py-4 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                  style={{background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)'}}
                >
                  <Link to="/app/dashboard" className="flex items-center space-x-2">
                    <span>🏟️</span>
                    <span>Enter Your Empire</span>
                    <span>👑</span>
                  </Link>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ) : (
                <>
                  <button 
                    className="group relative px-8 py-4 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                    style={{background: 'linear-gradient(45deg, #10b981, #34d399, #6ee7b7)'}}
                  >
                    <Link to="/auth/register" className="flex items-center space-x-2">
                      <span>🚀</span>
                      <span>Start Your Dynasty</span>
                      <span>🏆</span>
                    </Link>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/30 to-orange-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  
                  <button 
                    className="group relative px-8 py-4 text-white font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-md bg-white/20 border-2 border-white/30 hover:bg-white/30"
                  >
                    <Link to="/auth/login" className="flex items-center space-x-2">
                      <span>🏈</span>
                      <span>Sign In</span>
                    </Link>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-3xl lg:text-center mb-16 animate-slide-up" style={{animationDelay: '0.6s'}}>
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-bold leading-7 text-yellow-400 mb-4">🏆 Revolutionary Fantasy 🏆</h2>
            <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Everything you need for <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">team ownership</span>
            </p>
            <p className="text-lg leading-8 text-blue-200">
              Own entire NFL teams and earn based on their real-world performance. Create private leagues, 
              participate in live auctions, and compete with friends throughout the season.
            </p>
          </div>
        </div>
        
        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 lg:gap-8">
            
            <div className="group relative backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 animate-slide-up" style={{animationDelay: '0.8s'}}>
              <div className="flex items-start space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  🏈
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">Live Team Auctions</h3>
                  <p className="text-blue-200 leading-relaxed">
                    Bid on entire NFL teams in thrilling live auctions. Snake draft system ensures fair nomination order for all participants. Real-time bidding with countdown timers.
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 animate-slide-up" style={{animationDelay: '1.0s'}}>
              <div className="flex items-start space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  💰
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">Real Money Payouts</h3>
                  <p className="text-blue-200 leading-relaxed">
                    Earn money based on your teams' wins, playoff performance, and Super Bowl success. Automated weekly payouts with transparent payout structures.
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 animate-slide-up" style={{animationDelay: '1.2s'}}>
              <div className="flex items-start space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 text-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  🏟️
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">Private Leagues</h3>
                  <p className="text-blue-200 leading-relaxed">
                    Create exclusive leagues with friends. Customize auction settings, payout structures, and league rules. Invite-only access for ultimate control.
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 animate-slide-up" style={{animationDelay: '1.4s'}}>
              <div className="flex items-start space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  📱
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">Multi-Platform Access</h3>
                  <p className="text-blue-200 leading-relaxed">
                    Access your leagues from web, iOS, or Android. Real-time updates, push notifications, and seamless sync across all your devices.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="relative z-10 mx-auto mt-24 max-w-7xl px-6 lg:px-8 pb-24">
        <div className="relative backdrop-blur-md bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl animate-slide-up" style={{animationDelay: '1.6s'}}>
          {/* Background decoration */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-purple-500/10"></div>
          
          <div className="relative text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="flex space-x-2">
                <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.1s'}}>🏆</span>
                <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.2s'}}>🏈</span>
                <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.3s'}}>💰</span>
                <span className="text-3xl animate-bounce-gentle" style={{animationDelay: '0.4s'}}>👑</span>
              </div>
            </div>
            
            <h2 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Ready to <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">dominate</span> your league?
            </h2>
            
            <p className="mx-auto max-w-2xl text-xl leading-8 text-blue-200 mb-8">
              Join <span className="text-yellow-400 font-bold">thousands of NFL fans</span> competing in the most innovative fantasy football experience. 
              <span className="block mt-2 text-lg text-blue-300">Your dynasty starts here. 🚀</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                className="group relative px-10 py-4 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                style={{background: 'linear-gradient(45deg, #10b981, #34d399, #6ee7b7)'}}
              >
                <Link to="/auth/register" className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Start Your Empire Now</span>
                  <span>🏆</span>
                </Link>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/30 to-orange-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              <button 
                className="group relative px-10 py-4 text-white font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-md bg-white/20 border-2 border-white/30 hover:bg-white/30"
              >
                <Link to="/rules" className="flex items-center space-x-2">
                  <span>📚</span>
                  <span>Learn the Game</span>
                </Link>
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-blue-300 text-sm">
                🔥 Limited spots available in exclusive leagues 🔥
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
