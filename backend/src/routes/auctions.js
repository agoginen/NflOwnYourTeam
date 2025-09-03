const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Auction = require('../models/Auction');
const League = require('../models/League');
const NFLTeam = require('../models/NFLTeam');
const { protect, authorizeLeagueAdmin, authorizeLeagueMember } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    console.log('🚨 Validation failed:', {
      url: req.url,
      method: req.method,
      params: req.params,
      body: req.body,
      errors: errorMessages
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

// @desc    Create auction for league
// @route   POST /api/auctions
// @access  Private (League Admin)
router.post('/',
  protect,
  [
    body('leagueId')
      .isMongoId()
      .withMessage('Invalid league ID'),
    body('startTime')
      .optional()
      .isISO8601()
      .withMessage('Start time must be a valid date')
  ],
  handleValidationErrors,
  async (req, res, next) => {
    req.params.leagueId = req.body.leagueId;
    next();
  },
  authorizeLeagueAdmin,
  asyncHandler(async (req, res) => {
    const { startTime } = req.body;
    const league = req.league;

    // Check if league can start auction
    if (!league.canStartAuction) {
      throw new AppError('League must have at least 2 members to start auction', 400);
    }

    // For development: Allow creating new auctions even if one exists
    // In production, you might want to check auction status before allowing new ones
    if (league.auction) {
      // Clear the existing auction reference to allow new auction
      league.auction = null;
      await league.save();
    }

    // Get all NFL teams
    const nflTeams = await NFLTeam.find({ isActive: true });

    // Create auction
    const auction = await Auction.create({
      league: league._id,
      auctioneer: req.user.id, // Set the creator as the auctioneer
      startTime: startTime ? new Date(startTime) : new Date(),
      bidTimer: league.auctionSettings.auctionTimer,
      teams: nflTeams.map(team => ({
        nflTeam: team._id,
        status: 'available'
      })),
      participants: league.members.filter(member => member.isActive).map(member => ({
        user: member.user,
        spent: 0,
        teamsOwned: [],
        isActive: true
      })),
      settings: {
        minimumBid: league.auctionSettings.minimumBid,
        bidIncrement: league.auctionSettings.bidIncrement
      }
    });

    // Generate draft order
    auction.generateDraftOrder();
    
    // Start the auction immediately
    auction.start();
    await auction.save();

    // Update league
    league.auction = auction._id;
    league.status = 'auction';
    await league.save();

    // Populate auction data
    await auction.populate([
      {
        path: 'league',
        select: 'name'
      },
      {
        path: 'auctioneer',
        select: 'username firstName lastName'
      },
      {
        path: 'currentNominator',
        select: 'username firstName lastName'
      },
      {
        path: 'participants.user',
        select: 'username firstName lastName'
      },
      {
        path: 'teams.nflTeam',
        select: 'name city abbreviation conference division colors logo'
      }
    ]);

    // Emit auction created event
    const io = req.app.get('io');
    io.to(`league-${league._id}`).emit('auction-created', {
      auction: auction,
      message: 'Auction has been scheduled'
    });

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: auction
    });
  })
);

// @desc    Get auction
// @route   GET /api/auctions/:id
// @access  Private
router.get('/:id',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    console.log('🔍 Getting auction:', {
      auctionId: req.params.id,
      userId: req.user.id,
      userEmail: req.user.email
    });
    
    const auction = await Auction.findById(req.params.id)
      .populate([
        {
          path: 'league',
          select: 'name creator members'
        },
        {
          path: 'auctioneer',
          select: 'username firstName lastName'
        },
        {
          path: 'currentNominator',
          select: 'username firstName lastName'
        },
        {
          path: 'participants.user',
          select: 'username firstName lastName'
        },
        {
          path: 'teams.nflTeam',
          select: 'name city abbreviation conference division colors logo'
        },
        {
          path: 'teams.nominatedBy',
          select: 'username firstName lastName'
        },
        {
          path: 'teams.soldTo',
          select: 'username firstName lastName'
        },
        {
          path: 'currentTeam',
          select: 'name city abbreviation colors logo'
        },
        {
          path: 'currentHighBidder',
          select: 'username firstName lastName'
        }
      ]);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    // Check if user is a member of the league
    const isMember = auction.league.members.some(member =>
      member.user.toString() === req.user.id.toString() && member.isActive
    );

    // Debug logging
    console.log('🔍 Auction access check:', {
      userId: req.user.id,
      auctionId: auction._id,
      leagueId: auction.league._id,
      isMember,
      isParticipant: auction.participants.some(p => p.user.toString() === req.user.id.toString()),
      leagueMembersCount: auction.league.members.length,
      participantsCount: auction.participants.length,
      leagueMembers: auction.league.members.map(m => ({ 
        userId: m.user.toString(), 
        isActive: m.isActive,
        username: m.user?.username || 'Unknown'
      })),
      auctionParticipants: auction.participants.map(p => ({ 
        userId: p.user.toString(), 
        isActive: p.isActive,
        username: p.user?.username || 'Unknown'
      }))
    });

    // Also check if user is a participant in the auction
    const isParticipant = auction.participants.some(p => 
      p.user.toString() === req.user.id.toString()
    );

    if (!isMember && !isParticipant && !req.user.isSuperUser) {
      throw new AppError('Access denied. You must be a member of this league.', 403);
    }

    // Note: Participants are set during auction creation from league members
    // We should not add participants dynamically as this causes inconsistent counts

    res.status(200).json({
      success: true,
      data: auction
    });
  })
);

// @desc    Start auction
// @route   POST /api/auctions/:id/start
// @access  Private (League Admin)
router.post('/:id/start',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id)
      .populate('league');

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    // Check if user is league admin
    if (auction.league.creator.toString() !== req.user.id.toString() && !req.user.isSuperUser) {
      throw new AppError('Access denied. Only league administrators can start auctions.', 403);
    }

    if (auction.status !== 'scheduled') {
      throw new AppError('Auction cannot be started', 400);
    }

    // Start auction
    auction.start();
    await auction.save();

    // Emit auction started event
    const io = req.app.get('io');
    io.to(`league-${auction.league._id}`).emit('auction-started', {
      auction: auction,
      message: 'Auction has started!'
    });

    res.status(200).json({
      success: true,
      message: 'Auction started successfully',
      data: auction
    });
  })
);

// @desc    Nominate team
// @route   POST /api/auctions/:id/nominate
// @access  Private
router.post('/:id/nominate',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID'),
    body('teamId')
      .isMongoId()
      .withMessage('Invalid team ID'),
    body('startingBid')
      .isInt({ min: 1 })
      .withMessage('Starting bid must be at least 1')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { teamId, startingBid } = req.body;

    const auction = await Auction.findById(req.params.id)
      .populate([
        {
          path: 'league'
        },
        {
          path: 'teams.nflTeam',
          select: 'name city abbreviation'
        }
      ]);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    try {
      // Debug logging
      console.log('🏈 Nomination attempt:', {
        teamId,
        nominatorId: req.user.id,
        startingBid,
        auctionStatus: auction.status,
        currentNominator: auction.currentNominator?.toString(),
        isCorrectNominator: auction.currentNominator?.toString() === req.user.id.toString(),
        totalTeams: auction.teams?.length,
        availableTeams: auction.teams?.filter(t => t.status === 'available').length,
        targetTeam: auction.teams?.find(t => t.nflTeam?.toString() === teamId.toString())
      });
      
      // Nominate team
      auction.nominateTeam(teamId, req.user.id, startingBid);
      await auction.save();

      // Populate updated data
      await auction.populate([
        {
          path: 'currentTeam',
          select: 'name city abbreviation colors logo'
        },
        {
          path: 'currentNominator',
          select: 'username firstName lastName'
        },
        {
          path: 'currentHighBidder',
          select: 'username firstName lastName'
        }
      ]);

      // Emit nomination event
      const io = req.app.get('io');
      io.to(`auction-${auction._id}`).emit('team-nominated', {
        auction: auction,
        team: auction.currentTeam,
        nominator: auction.currentNominator,
        startingBid: startingBid,
        bidEndTime: auction.bidEndTime
      });

      res.status(200).json({
        success: true,
        message: 'Team nominated successfully',
        data: {
          auction: auction,
          timeRemaining: auction.timeRemaining
        }
      });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  })
);

// @desc    Place bid
// @route   POST /api/auctions/:id/bid
// @access  Private
router.post('/:id/bid',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID'),
    body('teamId')
      .isMongoId()
      .withMessage('Invalid team ID'),
    body('bidAmount')
      .isInt({ min: 1 })
      .withMessage('Bid amount must be at least 1')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { teamId, bidAmount } = req.body;

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    try {
      // Place bid
      auction.placeBid(teamId, req.user.id, bidAmount);
      await auction.save();

      // Populate updated data
      await auction.populate([
        {
          path: 'currentHighBidder',
          select: 'username firstName lastName'
        }
      ]);

      // Emit bid placed event
      const io = req.app.get('io');
      io.to(`auction-${auction._id}`).emit('bid-placed', {
        teamId: teamId,
        bidder: auction.currentHighBidder,
        bidAmount: bidAmount,
        bidEndTime: auction.bidEndTime,
        timeRemaining: auction.timeRemaining
      });

      res.status(200).json({
        success: true,
        message: 'Bid placed successfully',
        data: {
          currentBid: auction.currentBid,
          currentHighBidder: auction.currentHighBidder,
          timeRemaining: auction.timeRemaining
        }
      });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  })
);

// @desc    Debug auction data
// @route   GET /api/auctions/:id/debug
// @access  Private (Development only)
router.get('/:id/debug',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id)
      .populate([
        {
          path: 'league',
          select: 'name creator members'
        },
        {
          path: 'auctioneer',
          select: 'username firstName lastName'
        },
        {
          path: 'currentNominator',
          select: 'username firstName lastName'
        },
        {
          path: 'participants.user',
          select: 'username firstName lastName'
        }
      ]);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    const debugInfo = {
      auctionId: auction._id,
      status: auction.status,
      participantCount: auction.participants?.length || 0,
      participants: auction.participants?.map(p => ({
        id: p.user._id,
        username: p.user.username,
        spent: p.spent,
        teamsOwned: p.teamsOwned?.length || 0
      })) || [],
      currentNominator: auction.currentNominator ? {
        id: auction.currentNominator._id,
        username: auction.currentNominator.username
      } : null,
      auctioneer: auction.auctioneer ? {
        id: auction.auctioneer._id,
        username: auction.auctioneer.username
      } : null,
      draftOrder: auction.draftOrder?.map(d => ({
        userId: d.user,
        position: d.position
      })) || [],
      nominationOrder: auction.nominationOrder?.slice(0, 5).map(n => ({
        userId: n.user,
        round: n.round,
        position: n.position,
        hasNominated: n.hasNominated
      })) || [],
      currentNominationIndex: auction.currentNominationIndex,
      currentRound: auction.currentRound,
      requestingUserId: req.user.id,
      teamStatuses: auction.teams?.slice(0, 10).map(t => ({
        nflTeamId: t.nflTeam,
        status: t.status,
        nominatedBy: t.nominatedBy,
        soldTo: t.soldTo
      })) || [],
      availableTeamsCount: auction.teams?.filter(t => t.status === 'available').length || 0
    };

    res.status(200).json({
      success: true,
      data: debugInfo
    });
  })
);

// @desc    Reset auction participants (Development only)
// @route   POST /api/auctions/:id/reset-participants
// @access  Private (Development only)
router.post('/:id/reset-participants',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id)
      .populate('league');

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    // Check if user is league admin
    if (auction.league.creator.toString() !== req.user.id.toString() && !req.user.isSuperUser) {
      throw new AppError('Access denied. Only league administrators can reset participants.', 403);
    }

    // Reset participants to only league members (deduplicated)
    const activeMembers = auction.league.members.filter(member => member.isActive);
    console.log('🔧 Resetting participants:', {
      totalLeagueMembers: auction.league.members.length,
      activeMembers: activeMembers.length,
      currentParticipants: auction.participants.length,
      activeMembers: activeMembers.map(m => ({ 
        userId: m.user.toString(), 
        username: m.user?.username || 'Unknown' 
      }))
    });
    
    auction.participants = activeMembers.map(member => ({
      user: member.user,
      spent: 0,
      teamsOwned: [],
      isActive: true
    }));

    // Regenerate draft order
    auction.generateDraftOrder();
    
    // Start the auction
    if (auction.status === 'scheduled') {
      auction.start();
    }
    
    await auction.save();

    // Populate updated data
    await auction.populate([
      {
        path: 'currentNominator',
        select: 'username firstName lastName'
      },
      {
        path: 'participants.user',
        select: 'username firstName lastName'
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Participants reset successfully',
      data: {
        participantCount: auction.participants.length,
        participants: auction.participants.map(p => p.user.username),
        currentNominator: auction.currentNominator?.username
      }
    });
  })
);

// @desc    Complete current team auction
// @route   POST /api/auctions/:id/complete-team
// @access  Private (Auto-triggered when timer expires)
router.post('/:id/complete-team',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id)
      .populate([
        {
          path: 'currentTeam',
          select: 'name city abbreviation'
        },
        {
          path: 'currentHighBidder',
          select: 'username firstName lastName'
        }
      ]);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    if (auction.status !== 'active') {
      throw new AppError('Auction is not active', 400);
    }

    if (!auction.currentTeam) {
      throw new AppError('No active team auction to complete', 400);
    }

    const soldTeam = auction.currentTeam;
    const winner = auction.currentHighBidder;
    const finalPrice = auction.currentBid;

    // Complete team auction
    auction.completeCurrentTeamAuction();
    await auction.save();

    // Update league with sold team
    await League.findByIdAndUpdate(auction.league, {
      $set: {
        'teams.$[elem].owner': winner._id,
        'teams.$[elem].purchasePrice': finalPrice
      }
    }, {
      arrayFilters: [{ 'elem.nflTeam': soldTeam._id }]
    });

    // Emit team sold event
    const io = req.app.get('io');
    io.to(`auction-${auction._id}`).emit('team-sold', {
      team: soldTeam,
      winner: winner,
      finalPrice: finalPrice,
      isAuctionComplete: auction.status === 'completed',
      nextNominator: auction.currentNominator ? {
        id: auction.currentNominator,
        username: auction.currentNominator.username
      } : null
    });

    // If auction is complete, update league status
    if (auction.status === 'completed') {
      await League.findByIdAndUpdate(auction.league, {
        status: 'active'
      });

      io.to(`league-${auction.league}`).emit('auction-completed', {
        message: 'Auction has been completed!'
      });
    }

    res.status(200).json({
      success: true,
      message: auction.status === 'completed' ? 'Auction completed!' : 'Team sold successfully',
      data: {
        soldTeam,
        winner,
        finalPrice,
        auctionStatus: auction.status,
        progress: auction.progress
      }
    });
  })
);

// @desc    Pause auction
// @route   POST /api/auctions/:id/pause
// @access  Private (League Admin)
router.post('/:id/pause',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID'),
    body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Reason cannot exceed 255 characters')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const auction = await Auction.findById(req.params.id)
      .populate('league');

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    // Check if user is league admin
    if (auction.league.creator.toString() !== req.user.id.toString() && !req.user.isSuperUser) {
      throw new AppError('Access denied. Only league administrators can pause auctions.', 403);
    }

    if (auction.status !== 'active') {
      throw new AppError('Only active auctions can be paused', 400);
    }

    auction.pause(reason);
    await auction.save();

    // Emit auction paused event
    const io = req.app.get('io');
    io.to(`auction-${auction._id}`).emit('auction-paused', {
      reason: reason,
      message: 'Auction has been paused'
    });

    res.status(200).json({
      success: true,
      message: 'Auction paused successfully',
      data: auction
    });
  })
);

// @desc    Resume auction
// @route   POST /api/auctions/:id/resume
// @access  Private (League Admin)
router.post('/:id/resume',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id)
      .populate('league');

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    // Check if user is league admin
    if (auction.league.creator.toString() !== req.user.id.toString() && !req.user.isSuperUser) {
      throw new AppError('Access denied. Only league administrators can resume auctions.', 403);
    }

    if (auction.status !== 'paused') {
      throw new AppError('Only paused auctions can be resumed', 400);
    }

    auction.resume();
    await auction.save();

    // Emit auction resumed event
    const io = req.app.get('io');
    io.to(`auction-${auction._id}`).emit('auction-resumed', {
      bidEndTime: auction.bidEndTime,
      timeRemaining: auction.timeRemaining,
      message: 'Auction has been resumed'
    });

    res.status(200).json({
      success: true,
      message: 'Auction resumed successfully',
      data: auction
    });
  })
);

// @desc    Get auction bids
// @route   GET /api/auctions/:id/bids
// @access  Private
router.get('/:id/bids',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id)
      .populate([
        {
          path: 'bids.team',
          select: 'name city abbreviation'
        },
        {
          path: 'bids.bidder',
          select: 'username firstName lastName'
        }
      ])
      .select('bids league');

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    // Sort bids by timestamp (most recent first)
    const sortedBids = auction.bids.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      data: {
        bids: sortedBids,
        totalBids: sortedBids.length
      }
    });
  })
);

// @desc    Get participant budget info
// @route   GET /api/auctions/:id/budget
// @access  Private
router.get('/:id/budget',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid auction ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    const budgetInfo = auction.getParticipantSpending(req.user.id);

    if (!budgetInfo) {
      throw new AppError('You are not a participant in this auction', 403);
    }

    res.status(200).json({
      success: true,
      data: budgetInfo
    });
  })
);

module.exports = router;
