// App Configuration
export const APP_CONFIG = {
  NAME: 'NFL Own Your Team',
  SHORT_NAME: 'NFL OYT',
  VERSION: '1.0.0',
  DESCRIPTION: 'Fantasy football where you auction and own entire NFL teams',
  SUPPORT_EMAIL: 'support@nflownyourteam.com',
  WEBSITE: 'https://nflownyourteam.com',
};

// Theme Colors
export const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#1e40af',
  primaryLight: '#93c5fd',
  secondary: '#8b5cf6',
  secondaryDark: '#5b21b6',
  secondaryLight: '#c4b5fd',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Screen Breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// NFL Team Colors (sample - would include all 32 teams)
export const NFL_TEAM_COLORS = {
  cardinals: { primary: '#97233F', secondary: '#000000' },
  falcons: { primary: '#A71930', secondary: '#000000' },
  ravens: { primary: '#241773', secondary: '#000000' },
  bills: { primary: '#00338D', secondary: '#C60C30' },
  panthers: { primary: '#0085CA', secondary: '#101820' },
  bears: { primary: '#0B162A', secondary: '#C83803' },
  bengals: { primary: '#FB4F14', secondary: '#000000' },
  browns: { primary: '#311D00', secondary: '#FF3C00' },
  cowboys: { primary: '#003594', secondary: '#041E42' },
  broncos: { primary: '#FB4F14', secondary: '#002244' },
  lions: { primary: '#0076B6', secondary: '#B0B7BC' },
  packers: { primary: '#203731', secondary: '#FFB612' },
  texans: { primary: '#03202F', secondary: '#A71930' },
  colts: { primary: '#002C5F', secondary: '#A2AAAD' },
  jaguars: { primary: '#101820', secondary: '#D7A22A' },
  chiefs: { primary: '#E31837', secondary: '#FFB81C' },
  raiders: { primary: '#000000', secondary: '#A5ACAF' },
  chargers: { primary: '#0080C6', secondary: '#FFC20E' },
  rams: { primary: '#003594', secondary: '#FFA300' },
  dolphins: { primary: '#008E97', secondary: '#FC4C02' },
  vikings: { primary: '#4F2683', secondary: '#FFC62F' },
  patriots: { primary: '#002244', secondary: '#C60C30' },
  saints: { primary: '#D3BC8D', secondary: '#101820' },
  giants: { primary: '#0B2265', secondary: '#A71930' },
  jets: { primary: '#125740', secondary: '#000000' },
  eagles: { primary: '#004C54', secondary: '#A5ACAF' },
  steelers: { primary: '#FFB612', secondary: '#101820' },
  '49ers': { primary: '#AA0000', secondary: '#B3995D' },
  seahawks: { primary: '#002244', secondary: '#69BE28' },
  buccaneers: { primary: '#D50A0A', secondary: '#FF7900' },
  titans: { primary: '#0C2340', secondary: '#4B92DB' },
  commanders: { primary: '#5A1414', secondary: '#FFB612' },
};

// League Settings
export const LEAGUE_SETTINGS = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 12,
  DEFAULT_BUDGET: 1000,
  MIN_BID: 1,
  BID_INCREMENT: 1,
  BID_TIME_LIMIT: 30, // seconds
  PAYOUT_TYPES: ['winner_take_all', 'weekly_payouts', 'hybrid'],
};

// Auction Settings
export const AUCTION_SETTINGS = {
  STATES: ['draft', 'active', 'paused', 'completed'],
  MIN_BID_TIME: 10, // seconds
  MAX_BID_TIME: 120, // seconds
  DEFAULT_BID_TIME: 30, // seconds
  WARNING_TIME: 10, // seconds
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // League Events
  JOIN_LEAGUE: 'join-league',
  LEAVE_LEAGUE: 'leave-league',
  LEAGUE_UPDATED: 'league-updated',
  MEMBER_JOINED: 'member-joined',
  MEMBER_LEFT: 'member-left',
  
  // Auction Events
  JOIN_AUCTION: 'join-auction',
  LEAVE_AUCTION: 'leave-auction',
  AUCTION_CREATED: 'auction-created',
  AUCTION_STARTED: 'auction-started',
  AUCTION_PAUSED: 'auction-paused',
  AUCTION_RESUMED: 'auction-resumed',
  AUCTION_COMPLETED: 'auction-completed',
  TEAM_NOMINATED: 'team-nominated',
  BID_PLACED: 'bid-placed',
  TEAM_SOLD: 'team-sold',
  
  // NFL Data Events
  NFL_DATA_UPDATED: 'nfl-data-updated',
  PAYOUTS_CALCULATED: 'payouts-calculated',
  
  // General
  NOTIFICATION: 'notification',
  ERROR: 'error',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  LEAGUE_PREFERENCES: 'league_preferences',
  APP_SETTINGS: 'app_settings',
  NOTIFICATION_SETTINGS: 'notification_settings',
  THEME_PREFERENCE: 'theme_preference',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  OFFLINE: 'You are currently offline.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  REGISTER: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_UPDATED: 'Password updated successfully!',
  LEAGUE_CREATED: 'League created successfully!',
  LEAGUE_JOINED: 'Joined league successfully!',
  BID_PLACED: 'Bid placed successfully!',
  TEAM_NOMINATED: 'Team nominated successfully!',
};
