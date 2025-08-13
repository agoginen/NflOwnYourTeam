const express = require('express');
const { body, param, validationResult } = require('express-validator');
const NFLTeam = require('../models/NFLTeam');
const User = require('../models/User');
const League = require('../models/League');
const Auction = require('../models/Auction');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require super user access
router.use(protect);
router.use(authorize('superuser'));

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

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Super User)
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [userCount, leagueCount, activeLeagues, completedAuctions] = await Promise.all([
    User.countDocuments(),
    League.countDocuments(),
    League.countDocuments({ status: 'active' }),
    Auction.countDocuments({ status: 'completed' })
  ]);

  const recentLeagues = await League.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('creator', 'username email')
    .select('name status memberCount createdAt');

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('username email firstName lastName createdAt');

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers: userCount,
        totalLeagues: leagueCount,
        activeLeagues: activeLeagues,
        completedAuctions: completedAuctions
      },
      recentLeagues,
      recentUsers
    }
  });
}));

// @desc    Update NFL team data
// @route   PUT /api/admin/nfl-teams/:id
// @access  Private (Super User)
router.put('/nfl-teams/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid team ID'),
    body('weeklyResult')
      .optional()
      .isObject()
      .withMessage('Weekly result must be an object'),
    body('weeklyResult.week')
      .if(body('weeklyResult').exists())
      .isInt({ min: 1, max: 22 })
      .withMessage('Week must be between 1 and 22'),
    body('weeklyResult.result')
      .if(body('weeklyResult').exists())
      .isIn(['W', 'L', 'T'])
      .withMessage('Result must be W, L, or T'),
    body('weeklyResult.teamScore')
      .if(body('weeklyResult').exists())
      .isInt({ min: 0 })
      .withMessage('Team score must be a positive integer'),
    body('weeklyResult.opponentScore')
      .if(body('weeklyResult').exists())
      .isInt({ min: 0 })
      .withMessage('Opponent score must be a positive integer'),
    body('playoffStatus')
      .optional()
      .isIn(['none', 'wildcard', 'divisional', 'conference', 'superbowl', 'champion'])
      .withMessage('Invalid playoff status')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { weeklyResult, playoffStatus } = req.body;

    const team = await NFLTeam.findById(req.params.id);

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Update weekly result if provided
    if (weeklyResult) {
      team.updateWeeklyResult(
        weeklyResult.week,
        weeklyResult.result,
        weeklyResult.teamScore,
        weeklyResult.opponentScore,
        weeklyResult.opponent,
        weeklyResult.isHome,
        weeklyResult.gameDate,
        weeklyResult.isPlayoff,
        weeklyResult.playoffRound
      );
    }

    // Update playoff status if provided
    if (playoffStatus) {
      team.currentSeason.playoffStatus = playoffStatus;
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team data updated successfully',
      data: team
    });
  })
);

// @desc    Reset NFL season
// @route   POST /api/admin/nfl-teams/reset-season
// @access  Private (Super User)
router.post('/nfl-teams/reset-season',
  [
    body('year')
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Year must be between 2020 and 2030')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { year } = req.body;

    await NFLTeam.resetSeason(year);

    res.status(200).json({
      success: true,
      message: `NFL season reset for year ${year}`
    });
  })
);

// @desc    Get all users (admin view)
// @route   GET /api/admin/users
// @access  Private (Super User)
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;

  const query = search ? {
    $or: [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ]
  } : {};

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: '-password'
  };

  const users = await User.paginate(query, options);

  res.status(200).json({
    success: true,
    data: users
  });
}));

// @desc    Get all leagues (admin view)
// @route   GET /api/admin/leagues
// @access  Private (Super User)
router.get('/leagues', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = '' } = req.query;

  const query = status ? { status } : {};

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'creator',
        select: 'username email firstName lastName'
      }
    ]
  };

  const leagues = await League.paginate(query, options);

  res.status(200).json({
    success: true,
    data: leagues
  });
}));

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Super User)
router.put('/users/:id/status',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    body('isSuperUser')
      .optional()
      .isBoolean()
      .withMessage('isSuperUser must be a boolean')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { isVerified, isSuperUser } = req.body;

    const updateFields = {};
    if (isVerified !== undefined) updateFields.isVerified = isVerified;
    if (isSuperUser !== undefined) updateFields.isSuperUser = isSuperUser;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, select: '-password' }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });
  })
);

// @desc    Force complete auction
// @route   POST /api/admin/auctions/:id/force-complete
// @access  Private (Super User)
router.post('/auctions/:id/force-complete',
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

    auction.status = 'completed';
    auction.endTime = new Date();
    await auction.save();

    // Update league status
    await League.findByIdAndUpdate(auction.league, {
      status: 'active'
    });

    res.status(200).json({
      success: true,
      message: 'Auction force completed successfully',
      data: auction
    });
  })
);

// @desc    Get system logs (placeholder)
// @route   GET /api/admin/logs
// @access  Private (Super User)
router.get('/logs', asyncHandler(async (req, res) => {
  // This would typically read from log files or a logging service
  const logs = [
    {
      timestamp: new Date(),
      level: 'info',
      message: 'System is running normally',
      service: 'api'
    }
  ];

  res.status(200).json({
    success: true,
    data: logs
  });
}));

module.exports = router;
