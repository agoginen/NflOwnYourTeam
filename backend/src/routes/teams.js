const express = require('express');
const { param, validationResult } = require('express-validator');
const NFLTeam = require('../models/NFLTeam');
const { protect, optionalAuth } = require('../middleware/auth');
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

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Public
router.get('/:id',
  optionalAuth,
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

module.exports = router;
