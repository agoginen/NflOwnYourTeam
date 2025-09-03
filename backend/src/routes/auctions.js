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
      errors: errorMessages,
      detailedErrors: errors.array().map(error => ({
        field: error.path || error.param,
        value: error.value,
        message: error.msg,
        location: error.location
      }))
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

/**
 * @swagger
 * /api/auctions:
 *   post:
 *     summary: Create auction for league
 *     description: Creates a new auction for a league with all NFL teams available for bidding
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leagueId
 *             properties:
 *               leagueId:
 *                 type: string
 *                 description: League ID to create auction for
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Optional start time for the auction
 *                 example: "2024-01-15T18:00:00Z"
 *     responses:
 *       201:
 *         description: Auction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auction created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Auction'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not league admin
 *       404:
 *         description: League not found
 */
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
    const auctionTeams = nflTeams.map(team => ({
      nflTeam: team._id,
      status: 'available'
    }));
    
    console.log('🏈 Creating auction with teams:', {
      totalNflTeams: nflTeams.length,
      auctionTeamsCount: auctionTeams.length,
      firstFewTeams: auctionTeams.slice(0, 3).map(t => ({
        nflTeam: t.nflTeam?.toString(),
        status: t.status
      }))
    });
    
    const auction = await Auction.create({
      league: league._id,
      auctioneer: req.user.id, // Set the creator as the auctioneer
      startTime: startTime ? new Date(startTime) : new Date(),
      bidTimer: league.auctionSettings.auctionTimer,
      teams: auctionTeams,
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

/**
 * @swagger
 * /api/auctions/{id}:
 *   get:
 *     summary: Get auction details
 *     description: Retrieves detailed information about a specific auction
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Auction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Auction'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a member of the league
 *       404:
 *         description: Auction not found
 */
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
    
    // Debug: Log auction teams data
    console.log('🔍 Auction teams debug:', {
      auctionId: auction._id,
      totalTeams: auction.teams?.length || 0,
      teamsWithNflTeam: auction.teams?.filter(t => t.nflTeam).length || 0,
      firstFewTeams: auction.teams?.slice(0, 3).map(t => ({
        _id: t._id?.toString(),
        nflTeam: t.nflTeam?.toString(),
        status: t.status,
        nflTeamPopulated: !!t.nflTeam?.name
      })) || []
    });

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

/**
 * @swagger
 * /api/auctions/{id}/start:
 *   post:
 *     summary: Start auction
 *     description: Starts an auction, making it active and setting the first nominator
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Auction started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auction started successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Auction'
 *       400:
 *         description: Bad request - auction cannot be started
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not league admin
 *       404:
 *         description: Auction not found
 */
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

/**
 * @swagger
 * /api/auctions/{id}/nominate:
 *   post:
 *     summary: Nominate team for auction
 *     description: Nominates an NFL team for auction bidding
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *               - startingBid
 *             properties:
 *               teamId:
 *                 type: string
 *                 description: NFL Team ID to nominate
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               startingBid:
 *                 type: integer
 *                 minimum: 1
 *                 description: Starting bid amount
 *                 example: 5
 *     responses:
 *       200:
 *         description: Team nominated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Team nominated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     auction:
 *                       $ref: '#/components/schemas/Auction'
 *                     timeRemaining:
 *                       type: integer
 *                       description: Time remaining in seconds
 *       400:
 *         description: Bad request - team not available or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not your turn to nominate
 *       404:
 *         description: Auction not found
 */
router.post('/:id/nominate',
  protect,
  // Temporarily disable validation for debugging
  // [
  //   param('id')
  //     .isMongoId()
  //     .withMessage('Invalid auction ID'),
  //   body('teamId')
  //     .isMongoId()
  //     .withMessage('Invalid team ID'),
  //   body('startingBid')
  //     .isNumeric()
  //     .withMessage('Starting bid must be a number')
  //     .custom((value) => {
  //       const num = parseInt(value);
  //       if (isNaN(num) || num < 1) {
  //         throw new Error('Starting bid must be at least 1');
  //       }
  //       return true;
  //     })
  // ],
  // handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { teamId, startingBid } = req.body;
    
    console.log('🔍 Nomination request received:', {
      teamId: teamId?.toString(),
      teamIdType: typeof teamId,
      startingBid: startingBid?.toString(),
      startingBidType: typeof startingBid,
      auctionId: req.params.id,
      userId: req.user.id?.toString()
    });
    
    // Basic validation (temporarily replacing express-validator)
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }
    
    if (!startingBid) {
      return res.status(400).json({
        success: false,
        message: 'Starting bid is required'
      });
    }
    
    // Ensure startingBid is an integer
    const bidAmount = parseInt(startingBid);
    
    if (isNaN(bidAmount) || bidAmount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Starting bid must be at least 1'
      });
    }

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
      const targetTeam = auction.teams?.find(t => t.nflTeam?.toString() === teamId.toString());
      console.log('🏈 Nomination attempt:', {
        teamId: teamId?.toString(),
        teamIdType: typeof teamId,
        nominatorId: req.user.id?.toString(),
        startingBid: bidAmount,
        auctionStatus: auction.status,
        currentNominator: auction.currentNominator?.toString(),
        isCorrectNominator: auction.currentNominator?.toString() === req.user.id.toString(),
        totalTeams: auction.teams?.length,
        availableTeams: auction.teams?.filter(t => t.status === 'available').length,
        targetTeam: targetTeam ? {
          _id: targetTeam._id?.toString(),
          nflTeam: targetTeam.nflTeam?.toString(),
          status: targetTeam.status,
          nominatedBy: targetTeam.nominatedBy?.toString(),
          soldTo: targetTeam.soldTo?.toString()
        } : null,
        firstFewTeams: auction.teams?.slice(0, 3).map(t => ({
          _id: t._id?.toString(),
          nflTeam: t.nflTeam?.toString(),
          status: t.status,
          nflTeamName: t.nflTeam?.name || 'Unknown'
        })),
        teamsWithMatchingId: auction.teams?.filter(t => t.nflTeam?.toString() === teamId?.toString()).map(t => ({
          _id: t._id?.toString(),
          nflTeam: t.nflTeam?.toString(),
          status: t.status
        })),
        allTeamIds: auction.teams?.map(t => t.nflTeam?.toString()).filter(Boolean)
      });
      
      // Nominate team
      auction.nominateTeam(teamId, req.user.id, bidAmount);
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
        startingBid: bidAmount,
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

/**
 * @swagger
 * /api/auctions/{id}/bid:
 *   post:
 *     summary: Place bid on current team
 *     description: Places a bid on the currently nominated team
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bidAmount
 *             properties:
 *               bidAmount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Bid amount
 *                 example: 10
 *     responses:
 *       200:
 *         description: Bid placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bid placed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentBid:
 *                       type: integer
 *                       example: 10
 *                     currentHighBidder:
 *                       type: string
 *                       description: User ID of current high bidder
 *                     timeRemaining:
 *                       type: integer
 *                       description: Time remaining in seconds
 *       400:
 *         description: Bad request - invalid bid amount or auction not active
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Auction not found
 */
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
      .isNumeric()
      .withMessage('Bid amount must be a number')
      .custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
          throw new Error('Bid amount must be at least 1');
        }
        return true;
      })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { teamId, bidAmount } = req.body;
    
    // Ensure bidAmount is an integer
    const bidAmountInt = parseInt(bidAmount);

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    try {
      // Place bid
      auction.placeBid(teamId, req.user.id, bidAmountInt);
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
        bidAmount: bidAmountInt,
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

/**
 * @swagger
 * /api/auctions/{id}/debug:
 *   get:
 *     summary: Debug auction data (Development only)
 *     description: Retrieves detailed debug information about an auction for development purposes
 *     tags: [Auctions, Development]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Debug data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     auctionId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     participantCount:
 *                       type: integer
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                     currentNominator:
 *                       type: object
 *                     teamStatuses:
 *                       type: array
 *                     availableTeamsCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Auction not found
 */
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

/**
 * @swagger
 * /api/auctions/{id}/teams-debug:
 *   get:
 *     summary: Get auction teams debug info (Development only)
 *     description: Retrieves detailed information about all teams in an auction for debugging
 *     tags: [Auctions, Development]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Teams debug data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTeams:
 *                       type: integer
 *                       description: Total number of teams
 *                     availableTeams:
 *                       type: integer
 *                       description: Number of available teams
 *                     nominatedTeams:
 *                       type: integer
 *                       description: Number of nominated teams
 *                     soldTeams:
 *                       type: integer
 *                       description: Number of sold teams
 *                     teams:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           nflTeam:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                               abbreviation:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: ['available', 'nominated', 'sold']
 *                           nominatedBy:
 *                             type: string
 *                           soldTo:
 *                             type: string
 *                           finalPrice:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Auction not found
 */
router.get('/:id/teams-debug',
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
          path: 'teams.nflTeam',
          select: 'name city abbreviation'
        }
      ]);

    if (!auction) {
      throw new AppError('Auction not found', 404);
    }

    const teamsInfo = auction.teams.map(team => ({
      _id: team._id.toString(),
      nflTeam: {
        _id: team.nflTeam._id.toString(),
        name: team.nflTeam.name,
        city: team.nflTeam.city,
        abbreviation: team.nflTeam.abbreviation
      },
      status: team.status,
      nominatedBy: team.nominatedBy?.toString() || null,
      soldTo: team.soldTo?.toString() || null,
      finalPrice: team.finalPrice || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        totalTeams: auction.teams.length,
        availableTeams: auction.teams.filter(t => t.status === 'available').length,
        nominatedTeams: auction.teams.filter(t => t.status === 'nominated').length,
        soldTeams: auction.teams.filter(t => t.status === 'sold').length,
        teams: teamsInfo
      }
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

/**
 * @swagger
 * /api/auctions/{id}/pause:
 *   post:
 *     summary: Pause auction
 *     description: Pauses an active auction
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for pausing the auction
 *                 example: "Technical difficulties"
 *     responses:
 *       200:
 *         description: Auction paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auction paused successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Auction'
 *       400:
 *         description: Bad request - auction cannot be paused
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not league admin
 *       404:
 *         description: Auction not found
 */
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

/**
 * @swagger
 * /api/auctions/{id}/resume:
 *   post:
 *     summary: Resume auction
 *     description: Resumes a paused auction
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Auction resumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auction resumed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Auction'
 *       400:
 *         description: Bad request - auction cannot be resumed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not league admin
 *       404:
 *         description: Auction not found
 */
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

/**
 * @swagger
 * /api/auctions/{id}/bids:
 *   get:
 *     summary: Get auction bids
 *     description: Retrieves all bids for a specific auction
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Bids retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Bid ID
 *                       team:
 *                         type: string
 *                         description: NFL Team ID
 *                       bidder:
 *                         type: string
 *                         description: User ID of bidder
 *                       amount:
 *                         type: integer
 *                         description: Bid amount
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       isWinning:
 *                         type: boolean
 *                         description: Whether this is the current winning bid
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Auction not found
 */
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

/**
 * @swagger
 * /api/auctions/{id}/budget:
 *   get:
 *     summary: Get participant budget info
 *     description: Retrieves budget information for the current user in the auction
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Auction ID
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Budget info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     spent:
 *                       type: integer
 *                       description: Amount spent so far
 *                       example: 25
 *                     teamsOwned:
 *                       type: integer
 *                       description: Number of teams owned
 *                       example: 2
 *                     remainingBudget:
 *                       type: integer
 *                       description: Remaining budget (unlimited = -1)
 *                       example: -1
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Auction not found
 */
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
