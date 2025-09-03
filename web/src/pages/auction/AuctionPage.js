import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Countdown from 'react-countdown';
import toast from 'react-hot-toast';

import {
  fetchAuction,
  fetchAuctionBids,
  fetchParticipantBudget,
  nominateTeam,
  placeBid,
  startAuction,
  pauseAuction,
  resumeAuction,
  clearError,
  selectCurrentAuction,
  selectAuctionBids,
  selectParticipantBudget,
  selectAuctionLoading,
  selectBidLoading,
  selectNominateLoading,
  selectAuctionError,
} from '../../store/slices/auctionSlice';

import { fetchNFLTeams, selectNFLTeams } from '../../store/slices/nflSlice';
import { selectUser } from '../../store/slices/authSlice';
import { socketService } from '../../services/socketService';
import ErrorBoundary from '../../components/common/ErrorBoundary';

import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

const AuctionPage = () => {
  const { id } = useParams();
  

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const auction = useSelector(selectCurrentAuction);
  const bids = useSelector(selectAuctionBids);
  const budget = useSelector(selectParticipantBudget);
  const nflTeams = useSelector(selectNFLTeams);
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuctionLoading);
  const bidLoading = useSelector(selectBidLoading);
  const nominateLoading = useSelector(selectNominateLoading);
  const error = useSelector(selectAuctionError);

  const [bidAmount, setBidAmount] = useState('');
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [startingBid, setStartingBid] = useState('');
  const [showBidHistory, setShowBidHistory] = useState(false);
  
  const bidInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchAuction(id));
      dispatch(fetchAuctionBids(id));
      dispatch(fetchParticipantBudget(id));
      dispatch(fetchNFLTeams());
      
      // Join auction room
      socketService.joinAuction(id);
    }

    return () => {
      if (id) {
        socketService.leaveAuction(id);
      }
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (auction?.currentTeam && auction?.currentBid) {
      const currentBid = Number(auction.currentBid) || 0;
      const minBid = currentBid + (auction.bidIncrement || 1);
      setBidAmount(minBid.toString());
    }
  }, [auction?.currentTeam, auction?.currentBid, auction?.bidIncrement]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
      
      // If it's an access denied error, redirect to leagues
      if (error.includes('Access denied') || error.includes('must be a member')) {
        navigate('/app/leagues');
      }
    }
  }, [error, dispatch]); // navigate is stable and doesn't need to be in dependencies

  if (loading) {
    return <LoadingSpinner text="Loading auction..." />;
  }

  if (!auction) {
    return <Navigate to="/app/leagues" replace />;
  }



  // Add safety checks for required auction properties
  if (!auction.league || !auction.status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Auction Data</h2>
          <p className="text-gray-600 mb-4">The auction data is incomplete or corrupted.</p>
          <button 
            onClick={() => navigate('/app/leagues')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Leagues
          </button>
        </div>
      </div>
    );
  }

  const isAuctioneer = auction.auctioneer?._id === user?.id;
  const isCurrentNominator = auction.currentNominator?._id === user?.id;
  const isMyHighBid = auction.currentHighBidder?._id === user?.id;
  
  const availableTeams = nflTeams.filter(team => 
    !auction.teams?.some(auctionTeam => 
      auctionTeam.nflTeam?._id === team._id && auctionTeam.status !== 'available'
    )
  );

  const handleStartAuction = () => {
    dispatch(startAuction(id));
  };

  const handlePauseAuction = () => {
    dispatch(pauseAuction({ auctionId: id, reason: 'Manual pause' }));
  };

  const handleResumeAuction = () => {
    dispatch(resumeAuction(id));
  };

  const handleNominateTeam = () => {
    if (!selectedTeam || !startingBid) {
      toast.error('Please select a team and starting bid');
      return;
    }

    const bid = parseInt(startingBid);
    const minBid = Number(auction.minBid) || 1;
    if (bid < minBid) {
      toast.error(`Minimum bid is $${minBid}`);
      return;
    }

    // No budget limit check - unlimited spending allowed

    dispatch(nominateTeam({
      auctionId: id,
      teamId: selectedTeam._id,
      startingBid: bid
    }));

    setShowNominateModal(false);
    setSelectedTeam(null);
    setStartingBid('');
  };

  const handlePlaceBid = () => {
    if (!auction.currentTeam) {
      toast.error('No team is currently being auctioned');
      return;
    }

    const bid = parseInt(bidAmount);
    const currentBid = Number(auction.currentBid) || 0;
    if (isNaN(bid) || bid <= currentBid) {
      toast.error(`Bid must be higher than $${currentBid}`);
      return;
    }

    // No budget limit check - unlimited spending allowed

    dispatch(placeBid({
      auctionId: id,
      teamId: auction.currentTeam?._id,
      bidAmount: bid
    }));

    setBidAmount('');
    setTimeout(() => bidInputRef.current?.focus(), 100);
  };

  const handleQuickBid = (increment) => {
    const currentBid = Number(auction.currentBid) || 0;
    const newBid = currentBid + increment;
    setBidAmount(newBid.toString());
  };

  // Debug function (development only)
  const handleDebugAuction = async () => {
    try {
      const response = await fetch(`/api/auctions/${id}/debug`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('🐛 Auction Debug Data:', data);
      toast.success('Debug data logged to console');
    } catch (error) {
      console.error('Debug failed:', error);
      toast.error('Debug failed');
    }
  };

  // Reset participants function (development only)
  const handleResetParticipants = async () => {
    try {
      const response = await fetch(`/api/auctions/${id}/reset-participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('🔄 Reset Result:', data);
      toast.success('Participants reset - refresh page');
      // Refresh auction data
      dispatch(fetchAuction(id));
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Reset failed');
    }
  };

  // Debug teams function (development only)
  const handleDebugTeams = async () => {
    try {
      const response = await fetch(`/api/auctions/${id}/teams-debug`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('🏈 Teams Debug Data:', data);
      toast.success('Teams debug data logged to console');
    } catch (error) {
      console.error('Teams debug failed:', error);
      toast.error('Teams debug failed');
    }
  };

  const getAuctionStatusColor = () => {
    switch (auction.status) {
      case 'scheduled': return 'bg-gray-500';
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const countdownRenderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      return <span className="text-red-500 font-bold">TIME'S UP!</span>;
    }
    
    const isUrgent = minutes === 0 && seconds <= 10;
    return (
      <span className={`font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  };



  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{String(auction.league?.name || 'Unknown League')} Auction</h1>
              <div className="flex items-center mt-1 space-x-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getAuctionStatusColor()}`}>
                  {String(auction.status || '').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {auction.teams?.filter(t => t.status === 'sold').length || 0} / {auction.teams?.length || 0} teams sold
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAuctioneer && (
                <>
                  {auction.status === 'scheduled' && (
                    <Button onClick={handleStartAuction} className="bg-green-600 hover:bg-green-700">
                      Start Auction
                    </Button>
                  )}
                  {auction.status === 'active' && (
                    <Button onClick={handlePauseAuction} variant="outline">
                      Pause Auction
                    </Button>
                  )}
                  {auction.status === 'paused' && (
                    <Button onClick={handleResumeAuction} className="bg-green-600 hover:bg-green-700">
                      Resume Auction
                    </Button>
                  )}
                </>
              )}
              
              <Button
                onClick={() => setShowBidHistory(!showBidHistory)}
                variant="outline"
                size="sm"
              >
                {showBidHistory ? 'Hide' : 'Show'} History
              </Button>
              
              {/* Debug buttons (development only) */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Button
                    onClick={handleDebugAuction}
                    variant="outline"
                    size="sm"
                    className="bg-yellow-50 border-yellow-300 text-yellow-700"
                  >
                    Debug
                  </Button>
                  <Button
                    onClick={handleDebugTeams}
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 border-blue-300 text-blue-700"
                  >
                    Teams
                  </Button>
                  {isAuctioneer && (
                    <Button
                      onClick={handleResetParticipants}
                      variant="outline"
                      size="sm"
                      className="bg-red-50 border-red-300 text-red-700"
                    >
                      Reset
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Auction Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Team Being Auctioned */}
            {auction.currentTeam ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <img
                      src={auction.currentTeam?.logo}
                      alt={String(auction.currentTeam?.name || 'Team logo')}
                      className="w-24 h-24 object-contain"
                      onError={(e) => {
                        e.target.outerHTML = `<div class="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg border text-2xl font-bold text-gray-600">${String(auction.currentTeam?.abbreviation || 'N/A')}</div>`;
                      }}
                    />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {String(auction.currentTeam?.city || '')} {String(auction.currentTeam?.name || '')}
                  </h2>
                  
                  <div className="text-sm text-gray-500 mb-4">
                    {String(auction.currentTeam?.conference || '')} {String(auction.currentTeam?.division || '')}
                  </div>

                  {/* Current Bid Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      ${(auction.currentBid || 0).toLocaleString()}
                    </div>
                    {auction.currentHighBidder && (
                      <div className="text-sm text-gray-600">
                        High bidder: <span className="font-semibold">{String(auction.currentHighBidder?.username || 'Unknown')}</span>
                        {isMyHighBid && <span className="text-green-600 ml-1">(You)</span>}
                      </div>
                    )}
                    
                    {/* Countdown Timer */}
                    {auction.bidEndTime && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-500 mb-1">Time Remaining:</div>
                        <div className="text-2xl">
                          <Countdown
                            date={auction.bidEndTime ? new Date(auction.bidEndTime) : new Date()}
                            renderer={countdownRenderer}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bidding Interface */}
                  {auction.status === 'active' && !isMyHighBid && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          ref={bidInputRef}
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Enter bid amount"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min={(Number(auction.currentBid) || 0) + 1}
                          // No max limit - unlimited spending
                        />
                        <Button
                          onClick={handlePlaceBid}
                          disabled={bidLoading || !bidAmount}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {bidLoading ? 'Bidding...' : 'Place Bid'}
                        </Button>
                      </div>
                      
                      {/* Quick Bid Buttons */}
                      <div className="flex justify-center space-x-2">
                        {[1, 5, 10, 25].map(increment => (
                          <Button
                            key={increment}
                            onClick={() => handleQuickBid(increment)}
                            variant="outline"
                            size="sm"
                          >
                            +${increment}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {isMyHighBid && auction.status === 'active' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">
                        🎉 You have the high bid!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 12a1 1 0 102 0V8a1 1 0 10-2 0v4zm1-7a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Team Currently Being Auctioned
                </h3>
                <p className="text-gray-500">
                  {auction.status === 'scheduled' ? 
                    'Waiting for auction to start...' : 
                    'Waiting for next team nomination...'}
                </p>
              </div>
            )}

            {/* Nominate Team Section */}
            {auction.status === 'active' && isCurrentNominator && !auction.currentTeam && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Your Turn to Nominate
                </h3>
                <p className="text-blue-700 mb-4">
                  Choose a team to put up for auction
                </p>
                <Button
                  onClick={() => setShowNominateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Nominate Team
                </Button>
              </motion.div>
            )}

            {/* Teams Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Teams Status ({auction.teams?.filter(t => t.status === 'sold').length || 0}/{auction.teams?.length || 0} sold)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {auction.teams?.map(({ nflTeam, status, soldTo, finalPrice }) => (
                  <div
                    key={nflTeam?._id}
                    className={`text-center p-2 rounded-lg border-2 ${
                      status === 'sold' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <img
                      src={nflTeam?.logo}
                      alt={String(nflTeam?.name || 'Team logo')}
                      className="w-8 h-8 mx-auto mb-1"
                      onError={(e) => {
                        e.target.outerHTML = `<div class="w-8 h-8 mx-auto mb-1 flex items-center justify-center bg-gray-100 rounded border text-xs font-bold text-gray-600">${String(nflTeam?.abbreviation || 'N/A')}</div>`;
                      }}
                    />
                    <div className="text-xs font-medium text-gray-900">
                      {String(nflTeam?.city || '')}
                    </div>
                    {status === 'sold' && (
                      <>
                        <div className="text-xs text-green-600 font-semibold">
                          ${(finalPrice || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {String(soldTo?.username || 'Unknown')}
                        </div>
                      </>
                    )}
                  </div>
                )) || []}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Spending Info */}
            {budget && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Spending</h3>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="text-sm text-blue-800 font-medium">Unlimited Budget</div>
                    <div className="text-xs text-blue-600">No spending limits - bid freely!</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Spent:</span>
                    <span className="font-semibold text-blue-600">${(budget?.spent || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teams Owned:</span>
                    <span className="font-semibold">{budget?.teamsOwned || 0}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Average per Team:</span>
                    <span className="font-semibold">
                      ${(budget?.teamsOwned > 0) ? Math.round((budget?.spent || 0) / budget.teamsOwned).toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Participants ({auction.participants?.length || 0})
              </h3>
              
              {/* Debug info (development only) */}
              {process.env.NODE_ENV === 'development' && auction.participants && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div><strong>Debug:</strong> Raw count: {auction.participants.length}</div>
                  <div><strong>Current Nominator:</strong> {auction.currentNominator?.username || 'None'} ({auction.currentNominator?._id})</div>
                  <div><strong>Status:</strong> {auction.status}</div>
                  <div><strong>Unique User IDs:</strong> {[...new Set(auction.participants.map(p => p.user?._id || 'no-id'))].length}</div>
                </div>
              )}
              
              <div className="space-y-2">
                {auction.participants?.map(participant => (
                  <div
                    key={participant._id}
                    className={`flex items-center justify-between p-2 rounded ${
                      participant.user?._id === user?.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <span className="font-medium text-gray-900">
                      {String(participant?.username || 'Unknown User')}
                      {participant.user?._id === user?.id && <span className="text-blue-600 ml-1">(You)</span>}
                      {participant.user?._id === auction.auctioneer?._id && <span className="text-purple-600 ml-1">(Host)</span>}
                    </span>
                    {auction.currentNominator?._id === participant.user?._id && auction.status === 'active' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Nominating
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bids */}
            {showBidHistory && bids.length > 0 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bids</h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bids?.slice(0, 10).map((bid, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        bid?.bidder?._id === user?.id ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{String(bid?.bidder?.username || 'Unknown')}</span>
                        <span className="text-gray-500 ml-2">{String(bid?.team?.city || 'Unknown Team')}</span>
                      </div>
                      <span className="font-semibold">${(bid?.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Nominate Team Modal */}
      <Modal
        isOpen={showNominateModal}
        onClose={() => setShowNominateModal(false)}
        title="Nominate Team"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {availableTeams.map(team => (
                <button
                  key={team._id}
                  onClick={() => setSelectedTeam(team)}
                  className={`p-3 border rounded-lg text-center ${
                    selectedTeam?._id === team._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={team.logo}
                    alt={String(team.name || 'Team logo')}
                    className="w-8 h-8 mx-auto mb-1"
                    onError={(e) => {
                      e.target.outerHTML = `<div class="w-8 h-8 mx-auto mb-1 flex items-center justify-center bg-gray-100 rounded border text-xs font-bold text-gray-600">${String(team.abbreviation || 'N/A')}</div>`;
                    }}
                  />
                  <div className="text-xs font-medium">{String(team.city || '')}</div>
                  <div className="text-xs text-gray-500">{String(team.name || '')}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Bid
            </label>
            <input
              type="number"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              placeholder={`Minimum: $${Number(auction.minBid) || 1}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              min={Number(auction.minBid) || 1}
              // No max limit - unlimited spending
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => setShowNominateModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNominateTeam}
              disabled={nominateLoading || !selectedTeam || !startingBid}
              className="flex-1"
            >
              {nominateLoading ? 'Nominating...' : 'Nominate Team'}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default AuctionPage;
