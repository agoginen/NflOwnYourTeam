const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const League = require('../models/League');
const User = require('../models/User');
const NFLTeam = require('../models/NFLTeam');
const { protect, authorizeLeagueAdmin, authorizeLeagueMember } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Leagues
 *   description: League management endpoints for fantasy football leagues
 */

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
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
 * /api/leagues:
 *   get:
 *     summary: Get all leagues for the current user
 *     tags: [Leagues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, auction, active, completed, cancelled]
 *         description: Filter leagues by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of leagues per page
 *     responses:
 *       200:
 *         description: List of user's leagues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/League'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Get all leagues for user
// @route   GET /api/leagues
// @access  Private
router.get('/', 
  protect,
  [
    query('status')
      .optional()
      .isIn(['draft', 'auction', 'active', 'completed', 'cancelled'])
      .withMessage('Invalid status filter'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {
      'members.user': req.user.id,
      'members.isActive': true
    };
    
    if (status) {
      query.status = status;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'creator',
          select: 'username firstName lastName'
        },
        {
          path: 'members.user',
          select: 'username firstName lastName'
        }
      ]
    };
    
    const leagues = await League.paginate(query, options);
    
    res.status(200).json({
      success: true,
      data: leagues
    });
  })
);

// @desc    Create new league
// @route   POST /api/leagues
// @access  Private
router.post('/',
  protect,
  [
    body('name')
      .isLength({ min: 3, max: 50 })
      .withMessage('League name must be between 3 and 50 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('maxMembers')
      .optional()
      .isInt({ min: 2, max: 32 })
      .withMessage('Max members must be between 2 and 32'),
    body('auctionSettings.minimumBid')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Minimum bid must be at least 1'),
    body('auctionSettings.bidIncrement')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Bid increment must be at least 1'),
    body('auctionSettings.auctionTimer')
      .optional()
      .isInt({ min: 30, max: 300 })
      .withMessage('Auction timer must be between 30 and 300 seconds')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      maxMembers,
      auctionSettings,
      payoutStructure,
      season,
      isPrivate,
      settings
    } = req.body;

    // Generate unique invite code
    const inviteCode = await League.generateInviteCode();

    // Get all NFL teams for this league
    const nflTeams = await NFLTeam.find({ isActive: true }).select('_id');

    // Create league
    const league = await League.create({
      name,
      description,
      inviteCode,
      creator: req.user.id,
      members: [{
        user: req.user.id,
        joinedAt: new Date(),
        isActive: true
      }],
      maxMembers: maxMembers || 32,
      season: {
        year: 2025 // Always 2025 for all leagues created now
      },
      auctionSettings: {
        minimumBid: auctionSettings?.minimumBid || 1,
        bidIncrement: auctionSettings?.bidIncrement || 1,
        auctionTimer: auctionSettings?.auctionTimer || 60
      },
      payoutStructure: payoutStructure || {},
      teams: nflTeams.map(team => ({
        nflTeam: team._id,
        owner: null,
        purchasePrice: 0,
        currentEarnings: 0
      })),
      isPrivate: isPrivate !== false,
      settings: settings || {}
    });

    // Add league to user's leagues
    await User.findByIdAndUpdate(req.user.id, {
      $push: { leagues: league._id }
    });

    // Populate league data
    await league.populate([
      {
        path: 'creator',
        select: 'username firstName lastName'
      },
      {
        path: 'teams.nflTeam',
        select: 'name city abbreviation conference division'
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'League created successfully',
      data: league
    });
  })
);

// @desc    Get single league
// @route   GET /api/leagues/:id
// @access  Private
router.get('/:id',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid league ID')
  ],
  handleValidationErrors,
  authorizeLeagueMember,
  asyncHandler(async (req, res) => {
    const league = await League.findById(req.params.id)
      .populate([
        {
          path: 'creator',
          select: 'username firstName lastName'
        },
        {
          path: 'members.user',
          select: 'username firstName lastName totalWinnings'
        },
        {
          path: 'teams.nflTeam',
          select: 'name city abbreviation conference division currentSeason colors logo'
        },
        {
          path: 'teams.owner',
          select: 'username firstName lastName'
        },
        {
          path: 'auction',
          select: 'status startTime currentTeam currentBid progress'
        }
      ]);

    if (!league) {
      throw new AppError('League not found', 404);
    }

    res.status(200).json({
      success: true,
      data: league
    });
  })
);

// @desc    Update league
// @route   PUT /api/leagues/:id
// @access  Private (League Admin)
router.put('/:id',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid league ID'),
    body('name')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('League name must be between 3 and 50 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
      .trim(),
    body('maxMembers')
      .optional()
      .isInt({ min: 2, max: 32 })
      .withMessage('Max members must be between 2 and 32'),
    body('payoutStructure')
      .optional()
      .custom((payoutStructure) => {
        const totalPercentage = Object.values(payoutStructure).reduce((sum, val) => sum + val, 0);
        if (totalPercentage > 100) {
          throw new Error('Total payout percentage cannot exceed 100%');
        }
        return true;
      })
  ],
  handleValidationErrors,
  authorizeLeagueAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, maxMembers, payoutStructure, auctionSettings, settings } = req.body;

    // Check if league can be updated
    if (req.league.status !== 'draft') {
      throw new AppError('League cannot be updated after auction has started', 400);
    }

    // Check if reducing max members would kick out existing members
    if (maxMembers && maxMembers < req.league.memberCount) {
      throw new AppError('Cannot reduce max members below current member count', 400);
    }

    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (maxMembers) updateFields.maxMembers = maxMembers;
    if (payoutStructure) updateFields.payoutStructure = { ...req.league.payoutStructure, ...payoutStructure };
    if (auctionSettings) updateFields.auctionSettings = { ...req.league.auctionSettings, ...auctionSettings };
    if (settings) updateFields.settings = { ...req.league.settings, ...settings };

    const league = await League.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'creator',
        select: 'username firstName lastName'
      },
      {
        path: 'members.user',
        select: 'username firstName lastName'
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'League updated successfully',
      data: league
    });
  })
);

// @desc    Join league with invite code
// @route   POST /api/leagues/join
// @access  Private
router.post('/join',
  protect,
  [
    body('inviteCode')
      .isLength({ min: 8, max: 8 })
      .withMessage('Invite code must be 8 characters')
      .isAlphanumeric()
      .withMessage('Invite code must be alphanumeric')
      .toUpperCase()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    const league = await League.findOne({ inviteCode })
      .populate([
        {
          path: 'creator',
          select: 'username firstName lastName'
        },
        {
          path: 'members.user',
          select: 'username firstName lastName'
        }
      ]);

    if (!league) {
      throw new AppError('Invalid invite code', 404);
    }

    if (league.isFull) {
      throw new AppError('League is full', 400);
    }

    if (league.status !== 'draft') {
      throw new AppError('Cannot join league after auction has started', 400);
    }

    // Check if user is already a member
    const existingMember = league.members.find(member =>
      member.user._id.toString() === req.user.id.toString() && member.isActive
    );

    if (existingMember) {
      throw new AppError('You are already a member of this league', 400);
    }

    // Add user to league
    league.addMember(req.user.id);
    await league.save();

    // Add league to user's leagues
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { leagues: league._id }
    });

    // Populate the new member
    await league.populate({
      path: 'members.user',
      select: 'username firstName lastName'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined league',
      data: league
    });
  })
);

// @desc    Leave league
// @route   POST /api/leagues/:id/leave
// @access  Private
router.post('/:id/leave',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid league ID')
  ],
  handleValidationErrors,
  authorizeLeagueMember,
  asyncHandler(async (req, res) => {
    // Check if user is the creator
    if (req.league.creator.toString() === req.user.id.toString()) {
      throw new AppError('League creator cannot leave the league. Delete the league instead.', 400);
    }

    // Check if league has started
    if (req.league.status !== 'draft') {
      throw new AppError('Cannot leave league after auction has started', 400);
    }

    // Remove user from league
    req.league.removeMember(req.user.id);
    await req.league.save();

    // Remove league from user's leagues
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { leagues: req.league._id }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left league'
    });
  })
);

// @desc    Remove member from league
// @route   DELETE /api/leagues/:id/members/:memberId
// @access  Private (League Admin)
router.delete('/:id/members/:memberId',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid league ID'),
    param('memberId')
      .isMongoId()
      .withMessage('Invalid member ID')
  ],
  handleValidationErrors,
  authorizeLeagueAdmin,
  asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    // Check if trying to remove self
    if (req.league.creator.toString() === memberId) {
      throw new AppError('Cannot remove league creator', 400);
    }

    // Check if league has started
    if (req.league.status !== 'draft') {
      throw new AppError('Cannot remove members after auction has started', 400);
    }

    // Remove member from league
    req.league.removeMember(memberId);
    await req.league.save();

    // Remove league from user's leagues
    await User.findByIdAndUpdate(memberId, {
      $pull: { leagues: req.league._id }
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  })
);

// @desc    Delete league
// @route   DELETE /api/leagues/:id
// @access  Private (League Admin)
router.delete('/:id',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid league ID')
  ],
  handleValidationErrors,
  authorizeLeagueAdmin,
  asyncHandler(async (req, res) => {
    // Check if league can be deleted
    if (req.league.status === 'active') {
      throw new AppError('Cannot delete active league', 400);
    }

    // Remove league from all members' leagues
    const memberIds = req.league.members.map(member => member.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { leagues: req.league._id } }
    );

    // Delete league
    await League.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'League deleted successfully'
    });
  })
);

// @desc    Get league standings
// @route   GET /api/leagues/:id/standings
// @access  Private
router.get('/:id/standings',
  protect,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid league ID')
  ],
  handleValidationErrors,
  authorizeLeagueMember,
  asyncHandler(async (req, res) => {
    const league = await League.findById(req.params.id)
      .populate([
        {
          path: 'teams.nflTeam',
          select: 'name city abbreviation currentSeason'
        },
        {
          path: 'teams.owner',
          select: 'username firstName lastName'
        }
      ]);

    // Calculate standings
    const standings = {};
    
    league.members.forEach(member => {
      if (member.isActive) {
        standings[member.user.toString()] = {
          user: member.user,
          totalEarnings: 0,
          teams: [],
          weeklyEarnings: []
        };
      }
    });

    league.teams.forEach(team => {
      if (team.owner) {
        const ownerId = team.owner._id.toString();
        if (standings[ownerId]) {
          standings[ownerId].teams.push({
            nflTeam: team.nflTeam,
            purchasePrice: team.purchasePrice,
            currentEarnings: team.currentEarnings
          });
          standings[ownerId].totalEarnings += team.currentEarnings;
        }
      }
    });

    // Convert to array and sort by total earnings
    const standingsArray = Object.values(standings)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .map((standing, index) => ({
        ...standing,
        rank: index + 1
      }));

    res.status(200).json({
      success: true,
      data: {
        league: {
          id: league._id,
          name: league.name,
          totalPrizePool: league.totalPrizePool,
          distributedWinnings: league.distributedWinnings
        },
        standings: standingsArray
      }
    });
  })
);

module.exports = router;
