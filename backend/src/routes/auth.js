const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, sendTokenResponse } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management endpoints
 */

// Validation middleware
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and cannot exceed 50 characters')
    .trim(),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and cannot exceed 50 characters')
    .trim()
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

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
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             username: "john_doe"
 *             email: "john@example.com"
 *             password: "Password123!"
 *             firstName: "John"
 *             lastName: "Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError('Email already registered', 400);
    }
    if (existingUser.username === username) {
      throw new AppError('Username already taken', 400);
    }
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName
  });

  sendTokenResponse(user, 201, res, 'User registered successfully');
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "admin@nflownyourteam.com"
 *             password: "Admin123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Debug logging
  console.log('🔍 Login attempt:', { email, passwordLength: password?.length });

  // Check for user (include password for comparison)
  const user = await User.findOne({ email }).select('+password');
  console.log('🔍 User found:', user ? `Yes (${user.email})` : 'No');

  if (!user) {
    console.log('❌ User not found in database');
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  console.log('🔍 Password match:', isMatch);

  if (!isMatch) {
    console.log('❌ Password does not match');
    throw new AppError('Invalid credentials', 401);
  }

  console.log('✅ Login successful for user:', user.email);
  sendTokenResponse(user, 200, res, 'Login successful');
}));

// Debug endpoint to check users (development only)
router.get('/debug/users', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  const users = await User.find({}).select('email username firstName lastName isSuperUser isVerified');
  res.json({
    success: true,
    count: users.length,
    users: users
  });
}));

// Debug endpoint to reset admin password (development only)
router.post('/debug/reset-admin', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  const adminEmail = 'admin@nflownyourteam.com';
  const adminPassword = 'Admin123!';
  
  let adminUser = await User.findOne({ email: adminEmail });
  
  if (adminUser) {
    // Reset password using the model method to ensure proper hashing
    adminUser.password = adminPassword;
    await adminUser.save();
    
    // Test the password to ensure it worked
    const testUser = await User.findOne({ email: adminEmail }).select('+password');
    const isMatch = await testUser.comparePassword(adminPassword);
    
    res.json({
      success: true,
      message: 'Admin password reset successfully',
      credentials: { email: adminEmail, password: adminPassword },
      passwordTest: isMatch ? 'PASS' : 'FAIL'
    });
  } else {
    // Create admin user if not exists
    adminUser = await User.create({
      username: 'admin',
      email: adminEmail,
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isSuperUser: true,
      isVerified: true
    });
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: { email: adminEmail, password: adminPassword }
    });
  }
}));

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('leagues', 'name status memberCount')
    .select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
}));

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', 
  protect,
  [
    body('firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name cannot exceed 50 characters')
      .trim(),
    body('lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name cannot exceed 50 characters')
      .trim(),
    body('username')
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Check if username is already taken (if being updated)
    if (fieldsToUpdate.username) {
      const existingUser = await User.findOne({ 
        username: fieldsToUpdate.username,
        _id: { $ne: req.user.id }
      });

      if (existingUser) {
        throw new AppError('Username already taken', 400);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      fieldsToUpdate, 
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    });
  })
);

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword',
  protect,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password updated successfully');
  })
);

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('No user found with that email address', 404);
    }

    // For now, just return success (in production, you'd send an actual email)
    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to email'
    });
  })
);

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
router.put('/settings',
  protect,
  [
    body('settings.notifications.email')
      .optional()
      .isBoolean()
      .withMessage('Email notifications setting must be a boolean'),
    body('settings.notifications.push')
      .optional()
      .isBoolean()
      .withMessage('Push notifications setting must be a boolean'),
    body('settings.notifications.sms')
      .optional()
      .isBoolean()
      .withMessage('SMS notifications setting must be a boolean'),
    body('settings.privacy.showStats')
      .optional()
      .isBoolean()
      .withMessage('Show stats setting must be a boolean'),
    body('settings.privacy.showWinnings')
      .optional()
      .isBoolean()
      .withMessage('Show winnings setting must be a boolean')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    // Update settings
    if (req.body.settings) {
      user.settings = {
        ...user.settings,
        ...req.body.settings
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: user.getPublicProfile()
    });
  })
);

// @desc    Delete account
// @route   DELETE /api/auth/deleteaccount
// @access  Private
router.delete('/deleteaccount',
  protect,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Password is incorrect', 400);
    }

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  })
);

module.exports = router;
