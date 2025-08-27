const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - requires valid JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check for token in cookies (for web sessions)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found.'
        });
      }
      
      // Update last login
      req.user.lastLogin = new Date();
      await req.user.save({ validateBeforeSave: false });
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.'
      });
    }
    
    // Check if user has required role
    let hasPermission = false;
    
    if (roles.includes('superuser') && req.user.isSuperUser) {
      hasPermission = true;
    }
    
    if (roles.includes('user')) {
      hasPermission = true;
    }
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// League admin authorization
const authorizeLeagueAdmin = async (req, res, next) => {
  try {
    const leagueId = req.params.id || req.params.leagueId || req.body.leagueId;
    
    if (!leagueId) {
      return res.status(400).json({
        success: false,
        message: 'League ID is required'
      });
    }
    
    const League = require('../models/League');
    const league = await League.findById(leagueId);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }
    
    // Check if user is league creator or super user
    if (league.creator.toString() !== req.user.id.toString() && !req.user.isSuperUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only league administrators can perform this action.'
      });
    }
    
    req.league = league;
    next();
  } catch (error) {
    console.error('League admin authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// League member authorization
const authorizeLeagueMember = async (req, res, next) => {
  try {
    const leagueId = req.params.id || req.params.leagueId || req.body.leagueId;
    
    if (!leagueId) {
      return res.status(400).json({
        success: false,
        message: 'League ID is required'
      });
    }
    
    const League = require('../models/League');
    const league = await League.findById(leagueId);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'League not found'
      });
    }
    
    // Check if user is a member of the league or super user
    const isMember = league.members.some(member => 
      member.user.toString() === req.user.id.toString() && member.isActive
    );
    
    if (!isMember && !req.user.isSuperUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member of this league.'
      });
    }
    
    req.league = league;
    next();
  } catch (error) {
    console.error('League member authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        // Invalid token, but continue without user
        req.user = null;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = generateToken(user._id);
  
  const options = {
    expires: new Date(
      Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  // Remove password from user object
  const userResponse = user.getPublicProfile();
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      user: userResponse
    });
};

module.exports = {
  protect,
  authorize,
  authorizeLeagueAdmin,
  authorizeLeagueMember,
  optionalAuth,
  generateToken,
  sendTokenResponse
};
