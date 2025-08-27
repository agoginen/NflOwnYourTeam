// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com/api'
    : 'http://localhost:5000/api',
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-production-api.com'
    : 'http://localhost:5000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    UPDATE_PASSWORD: '/auth/password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Users
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    STATS: (id) => `/users/${id}/stats`,
  },

  // Leagues
  LEAGUES: {
    LIST: '/leagues',
    CREATE: '/leagues',
    DETAIL: (id) => `/leagues/${id}`,
    UPDATE: (id) => `/leagues/${id}`,
    DELETE: (id) => `/leagues/${id}`,
    JOIN: '/leagues/join',
    LEAVE: (id) => `/leagues/${id}/leave`,
    MEMBERS: (id) => `/leagues/${id}/members`,
    STANDINGS: (id) => `/leagues/${id}/standings`,
    INVITE: (id) => `/leagues/${id}/invite`,
  },

  // Teams
  TEAMS: {
    LIST: '/teams',
    DETAIL: (id) => `/teams/${id}`,
    STATS: (id) => `/teams/${id}/stats`,
    SCHEDULE: (id) => `/teams/${id}/schedule`,
    USER_TEAMS: '/teams/user',
  },

  // Auctions
  AUCTIONS: {
    LIST: '/auctions',
    CREATE: '/auctions',
    DETAIL: (id) => `/auctions/${id}`,
    START: (id) => `/auctions/${id}/start`,
    PAUSE: (id) => `/auctions/${id}/pause`,
    RESUME: (id) => `/auctions/${id}/resume`,
    NOMINATE: (id) => `/auctions/${id}/nominate`,
    BID: (id) => `/auctions/${id}/bid`,
    BIDS: (id) => `/auctions/${id}/bids`,
    BUDGET: (id) => `/auctions/${id}/budget`,
    AVAILABLE_TEAMS: (id) => `/auctions/${id}/available-teams`,
    TIMELINE: (id) => `/auctions/${id}/timeline`,
  },

  // NFL Data
  NFL: {
    TEAMS: '/nfl/teams',
    STANDINGS: '/nfl/standings',
    PLAYOFFS: '/nfl/playoffs',
    CURRENT_WEEK: '/nfl/current-week',
    TEAM_STATS: (id) => `/nfl/teams/${id}/stats`,
    TEAM_SCHEDULE: (id) => `/nfl/teams/${id}/schedule`,
    SEARCH: '/nfl/search',
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    LEAGUES: '/admin/leagues',
    NFL_DATA: '/admin/nfl-data',
    SYSTEM_STATS: '/admin/stats',
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Request Headers
export const HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  AUTHORIZATION: 'Authorization',
  BEARER: 'Bearer',
};
