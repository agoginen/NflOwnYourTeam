import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeague, deleteLeague, selectCurrentLeague, selectLeagueLoading, selectLeagueError } from '../../store/slices/leagueSlice';
import { auctionService } from '../../services/auctionService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const InviteCodeCard = ({ inviteCode, leagueName }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareInvite = () => {
    const shareText = `Join my NFL fantasy league "${leagueName}"! Use invite code: ${inviteCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${leagueName}`,
        text: shareText,
      });
    } else {
      // Fallback to copying text
      copyToClipboard();
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Invite Others</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Invite Code
          </label>
          <div className="flex items-center space-x-2">
            <div className="bg-white border border-blue-300 rounded-md px-4 py-2 flex-1">
              <span className="font-mono text-lg tracking-wider text-center block">
                {inviteCode}
              </span>
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-blue-700">
          <p>Share this code with friends so they can join your league!</p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={shareInvite}
            className="flex-1"
            size="sm"
          >
            Share Invite
          </Button>
        </div>
      </div>
    </div>
  );
};

const MembersList = ({ members, isCreator, currentUserId }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Members ({members.filter(m => m.isActive).length})
      </h3>
      
      <div className="space-y-3">
        {members.filter(m => m.isActive).map((member) => (
          <div key={member.user._id} className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {member.user.firstName?.charAt(0) || member.user.username?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {member.user.firstName && member.user.lastName 
                    ? `${member.user.firstName} ${member.user.lastName}`
                    : member.user.username
                  }
                  {member.user._id === currentUserId && (
                    <span className="ml-2 text-sm text-gray-500">(You)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {isCreator && member.user._id !== currentUserId && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  // TODO: Implement remove member functionality
                  console.log('Remove member:', member.user._id);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LeagueDetailPage = () => {
  const { id: leagueId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const league = useSelector(selectCurrentLeague);
  const loading = useSelector(selectLeagueLoading);
  const error = useSelector(selectLeagueError);

  // You would get this from auth state
  const currentUserId = useSelector(state => state.auth.user?.id);
  const [startingDraft, setStartingDraft] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLeague, setDeletingLeague] = useState(false);

  useEffect(() => {
    if (leagueId) {
      dispatch(fetchLeague(leagueId));
    }
  }, [dispatch, leagueId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading League</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/leagues')}>
            Back to Leagues
          </Button>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">League Not Found</h2>
          <p className="text-gray-600 mb-4">The league you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/leagues')}>
            Back to Leagues
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = league.creator._id === currentUserId;
  const canStartAuction = league.canStartAuction && isCreator;

  const handleStartDraft = async () => {
    if (!league || startingDraft) return;
    
    setStartingDraft(true);
    try {
      // Create auction for the league
      const response = await auctionService.createAuction({
        leagueId: league._id,
        startTime: new Date().toISOString()
      });
      
      if (response.success) {
        toast.success('Draft started successfully! Redirecting...');
        
        // Refresh league data to update auction reference
        dispatch(fetchLeague(league._id));
        
        // Navigate to the auction page
        setTimeout(() => {
          navigate(`/app/auctions/${response.data._id}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to start draft:', error);
      toast.error(error.response?.data?.message || 'Failed to start draft');
    } finally {
      setStartingDraft(false);
    }
  };

  const handleDeleteLeague = async () => {
    if (!league || deletingLeague) return;
    
    setDeletingLeague(true);
    try {
      const result = await dispatch(deleteLeague(league._id));
      
      if (result.type === 'leagues/deleteLeague/fulfilled') {
        toast.success('League deleted successfully');
        navigate('/app/leagues');
      } else {
        toast.error(result.payload || 'Failed to delete league');
      }
    } catch (error) {
      console.error('Failed to delete league:', error);
      toast.error('Failed to delete league');
    } finally {
      setDeletingLeague(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{league.name}</h1>
            {league.description && (
              <p className="text-gray-600">{league.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {isCreator && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/leagues/${league._id}/edit`)}
                >
                  Edit League
                </Button>
                {league.status !== 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    Delete League
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={() => navigate(`/leagues/${league._id}/standings`)}
            >
              View Standings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Status</h3>
            <p className="text-2xl font-bold text-blue-600 capitalize">{league.status}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Members</h3>
            <p className="text-2xl font-bold text-green-600">
              {league.memberCount} / {league.maxMembers}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900">Season</h3>
            <p className="text-lg font-semibold text-gray-900">{league.season.year}</p>
            <p className="text-sm text-gray-600">NFL Season</p>
          </div>
        </div>

        {league.auction ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">Draft in Progress</h3>
                <p className="text-sm text-blue-700">Your league draft is currently active. Join now to participate in the auction!</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-gray-600 mt-1">Debug: Auction ID = {league.auction}</p>
                )}
              </div>
              <Button
                onClick={() => {
                  console.log('🔍 Joining auction:', league.auction);
                  if (!league.auction) {
                    toast.error('Auction ID not found. Please refresh the page.');
                    return;
                  }
                  navigate(`/app/auctions/${league.auction}`);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Join Draft
              </Button>
            </div>
          </div>
        ) : canStartAuction && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800">Ready to Start Draft</h3>
                <p className="text-sm text-green-700">You have enough members to begin the draft auction. All members will participate in real-time bidding.</p>
              </div>
              <Button
                onClick={handleStartDraft}
                className="bg-green-600 hover:bg-green-700"
                disabled={startingDraft}
              >
                {startingDraft ? 'Starting...' : 'Start Draft'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members List */}
          <MembersList 
            members={league.members} 
            isCreator={isCreator}
            currentUserId={currentUserId}
          />

          {/* League Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">League Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Auction Settings</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Budget: Unlimited</p>
                  <p>Minimum Bid: ${league.auctionSettings.minimumBid}</p>
                  <p>Bid Increment: ${league.auctionSettings.bidIncrement}</p>
                  <p>Auction Timer: {league.auctionSettings.auctionTimer}s</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">League Type</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Privacy: {league.isPrivate ? 'Private' : 'Public'}</p>
                  <p>Max Members: {league.maxMembers}</p>
                  <p>Created: {new Date(league.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Invite Code (only for league members) */}
          {league.status === 'draft' && (
            <InviteCodeCard 
              inviteCode={league.inviteCode} 
              leagueName={league.name}
            />
          )}

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Prize Pool</span>
                <span className="font-medium">${league.totalPrizePool || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teams Owned</span>
                <span className="font-medium">
                  {league.teams?.filter(t => t.owner).length || 0} / 32
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Spots</span>
                <span className="font-medium">{league.availableSpots}</span>
              </div>
            </div>
          </div>

          {/* League Creator */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">League Creator</h3>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {league.creator.firstName?.charAt(0) || league.creator.username?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {league.creator.firstName && league.creator.lastName 
                    ? `${league.creator.firstName} ${league.creator.lastName}`
                    : league.creator.username
                  }
                </p>
                <p className="text-sm text-gray-500">League Commissioner</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete League"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-red-800">Warning: This action cannot be undone</span>
            </div>
          </div>
          
          <p className="text-gray-700">
            Are you sure you want to delete <strong>"{league.name}"</strong>? 
            This will permanently remove the league and all associated data.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <strong>This will:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Remove all league members</li>
              <li>• Delete league settings and data</li>
              <li>• Cancel any ongoing drafts</li>
              <li>• Remove league from your account</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="outline"
              className="flex-1"
              disabled={deletingLeague}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLeague}
              disabled={deletingLeague}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingLeague ? 'Deleting...' : 'Delete League'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeagueDetailPage;