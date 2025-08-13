const express = require('express');
const { query, param, validationResult } = require('express-validator');
const NFLTeam = require('../models/NFLTeam');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

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

// @desc    Get all NFL teams
// @route   GET /api/nfl/teams
// @access  Public
router.get('/teams',
  [
    query('conference')
      .optional()
      .isIn(['AFC', 'NFC'])
      .withMessage('Conference must be AFC or NFC'),
    query('division')
      .optional()
      .isIn(['North', 'South', 'East', 'West'])
      .withMessage('Division must be North, South, East, or West'),
    query('sortBy')
      .optional()
      .isIn(['name', 'city', 'wins', 'winPercentage'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { conference, division, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Build query
    const query = { isActive: true };
    if (conference) query.conference = conference;
    if (division) query.division = division;

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'city':
        sort = { city: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'wins':
        sort = { 'currentSeason.wins': sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'winPercentage':
        // Sort by wins first, then by total games played
        sort = { 
          'currentSeason.wins': sortOrder === 'desc' ? -1 : 1,
          'currentSeason.losses': sortOrder === 'desc' ? 1 : -1
        };
        break;
      default:
        sort = { name: 1 };
    }

    const teams = await NFLTeam.find(query)
      .sort(sort)
      .select('-weeklyResults -allTimeStats -externalIds');

    // Group by divisions if no specific filters
    let response;
    if (!conference && !division) {
      response = {
        AFC: {
          North: teams.filter(t => t.conference === 'AFC' && t.division === 'North'),
          South: teams.filter(t => t.conference === 'AFC' && t.division === 'South'),
          East: teams.filter(t => t.conference === 'AFC' && t.division === 'East'),
          West: teams.filter(t => t.conference === 'AFC' && t.division === 'West')
        },
        NFC: {
          North: teams.filter(t => t.conference === 'NFC' && t.division === 'North'),
          South: teams.filter(t => t.conference === 'NFC' && t.division === 'South'),
          East: teams.filter(t => t.conference === 'NFC' && t.division === 'East'),
          West: teams.filter(t => t.conference === 'NFC' && t.division === 'West')
        }
      };
    } else {
      response = teams;
    }

    res.status(200).json({
      success: true,
      count: teams.length,
      data: response
    });
  })
);

// @desc    Get single NFL team
// @route   GET /api/nfl/teams/:id
// @access  Public
router.get('/teams/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid team ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const team = await NFLTeam.findById(req.params.id);

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    res.status(200).json({
      success: true,
      data: team
    });
  })
);

// @desc    Get team by abbreviation
// @route   GET /api/nfl/teams/abbr/:abbreviation
// @access  Public
router.get('/teams/abbr/:abbreviation',
  [
    param('abbreviation')
      .isLength({ min: 3, max: 3 })
      .withMessage('Abbreviation must be 3 characters')
      .isAlpha()
      .withMessage('Abbreviation must contain only letters')
      .toUpperCase()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const team = await NFLTeam.findOne({ 
      abbreviation: req.params.abbreviation,
      isActive: true 
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    res.status(200).json({
      success: true,
      data: team
    });
  })
);

// @desc    Get current season standings
// @route   GET /api/nfl/standings
// @access  Public
router.get('/standings',
  [
    query('conference')
      .optional()
      .isIn(['AFC', 'NFC'])
      .withMessage('Conference must be AFC or NFC'),
    query('division')
      .optional()
      .isIn(['North', 'South', 'East', 'West'])
      .withMessage('Division must be North, South, East, or West')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { conference, division } = req.query;

    // Build query
    const query = { isActive: true };
    if (conference) query.conference = conference;
    if (division) query.division = division;

    const teams = await NFLTeam.find(query)
      .select('name city abbreviation conference division currentSeason colors logo')
      .sort({ 
        'currentSeason.wins': -1, 
        'currentSeason.losses': 1,
        'currentSeason.ties': -1
      });

    // Group by divisions
    const standings = {};
    
    teams.forEach(team => {
      const conf = team.conference;
      const div = team.division;
      
      if (!standings[conf]) standings[conf] = {};
      if (!standings[conf][div]) standings[conf][div] = [];
      
      standings[conf][div].push({
        ...team.toObject(),
        rank: standings[conf][div].length + 1
      });
    });

    res.status(200).json({
      success: true,
      data: standings
    });
  })
);

// @desc    Get playoff teams
// @route   GET /api/nfl/playoffs
// @access  Public
router.get('/playoffs',
  asyncHandler(async (req, res) => {
    const playoffTeams = await NFLTeam.getPlayoffTeams()
      .select('name city abbreviation conference division currentSeason colors logo');

    // Group by playoff status
    const playoffs = {
      wildcard: [],
      divisional: [],
      conference: [],
      superbowl: [],
      champion: []
    };

    playoffTeams.forEach(team => {
      const status = team.currentSeason.playoffStatus;
      if (playoffs[status]) {
        playoffs[status].push(team);
      }
    });

    res.status(200).json({
      success: true,
      data: playoffs
    });
  })
);

// @desc    Get team schedule/results
// @route   GET /api/nfl/teams/:id/schedule
// @access  Public
router.get('/teams/:id/schedule',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid team ID'),
    query('week')
      .optional()
      .isInt({ min: 1, max: 22 })
      .withMessage('Week must be between 1 and 22'),
    query('isPlayoff')
      .optional()
      .isBoolean()
      .withMessage('isPlayoff must be a boolean')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { week, isPlayoff } = req.query;

    const team = await NFLTeam.findById(req.params.id)
      .select('name city abbreviation weeklyResults');

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    let schedule = team.weeklyResults;

    // Filter by week if provided
    if (week) {
      schedule = schedule.filter(game => game.week === parseInt(week));
    }

    // Filter by playoff status if provided
    if (isPlayoff !== undefined) {
      schedule = schedule.filter(game => game.isPlayoff === (isPlayoff === 'true'));
    }

    // Sort by week and game date
    schedule.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return new Date(a.gameDate) - new Date(b.gameDate);
    });

    res.status(200).json({
      success: true,
      data: {
        team: {
          id: team._id,
          name: team.name,
          city: team.city,
          abbreviation: team.abbreviation
        },
        schedule: schedule
      }
    });
  })
);

// @desc    Get current week info
// @route   GET /api/nfl/current-week
// @access  Public
router.get('/current-week',
  asyncHandler(async (req, res) => {
    // This is a simplified implementation
    // In a real app, you'd calculate this based on the current date and NFL schedule
    const currentDate = new Date();
    const seasonStart = new Date(currentDate.getFullYear(), 8, 1); // September 1st
    const weeksSinceStart = Math.floor((currentDate - seasonStart) / (7 * 24 * 60 * 60 * 1000));
    
    let currentWeek = Math.min(Math.max(weeksSinceStart + 1, 1), 18);
    let isPlayoffs = false;
    
    if (currentWeek > 18) {
      isPlayoffs = true;
      currentWeek = Math.min(currentWeek - 18, 4); // Playoff weeks 1-4
    }

    res.status(200).json({
      success: true,
      data: {
        week: currentWeek,
        isPlayoffs: isPlayoffs,
        season: currentDate.getFullYear()
      }
    });
  })
);

// @desc    Get team stats
// @route   GET /api/nfl/teams/:id/stats
// @access  Public
router.get('/teams/:id/stats',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid team ID')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const team = await NFLTeam.findById(req.params.id)
      .select('name city abbreviation currentSeason allTimeStats weeklyResults');

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    // Calculate additional stats
    const regularSeasonGames = team.weeklyResults.filter(game => !game.isPlayoff && game.result);
    const playoffGames = team.weeklyResults.filter(game => game.isPlayoff && game.result);

    const stats = {
      team: {
        id: team._id,
        name: team.name,
        city: team.city,
        abbreviation: team.abbreviation
      },
      currentSeason: {
        ...team.currentSeason.toObject(),
        gamesPlayed: regularSeasonGames.length,
        winPercentage: team.winPercentage,
        playoffGames: playoffGames.length,
        lastFiveGames: regularSeasonGames.slice(-5).map(game => game.result)
      },
      allTime: team.allTimeStats,
      recentGames: team.weeklyResults
        .filter(game => game.result)
        .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
        .slice(0, 10)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  })
);

// @desc    Search teams
// @route   GET /api/nfl/search
// @access  Public
router.get('/search',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { q } = req.query;

    const teams = await NFLTeam.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { abbreviation: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name city abbreviation conference division currentSeason colors logo')
    .limit(10);

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  })
);

module.exports = router;
