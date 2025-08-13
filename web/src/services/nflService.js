import api from './api';

export const nflService = {
  // Get all NFL teams
  getTeams: async (params = {}) => {
    const response = await api.get('/nfl/teams', { params });
    return response.data;
  },

  // Get single team
  getTeam: async (teamId) => {
    const response = await api.get(`/nfl/teams/${teamId}`);
    return response.data;
  },

  // Get team by abbreviation
  getTeamByAbbreviation: async (abbreviation) => {
    const response = await api.get(`/nfl/teams/abbr/${abbreviation}`);
    return response.data;
  },

  // Get current season standings
  getStandings: async (params = {}) => {
    const response = await api.get('/nfl/standings', { params });
    return response.data;
  },

  // Get playoff teams
  getPlayoffTeams: async () => {
    const response = await api.get('/nfl/playoffs');
    return response.data;
  },

  // Get team schedule/results
  getTeamSchedule: async (teamId, params = {}) => {
    const response = await api.get(`/nfl/teams/${teamId}/schedule`, { params });
    return response.data;
  },

  // Get current week info
  getCurrentWeek: async () => {
    const response = await api.get('/nfl/current-week');
    return response.data;
  },

  // Get team stats
  getTeamStats: async (teamId) => {
    const response = await api.get(`/nfl/teams/${teamId}/stats`);
    return response.data;
  },

  // Search teams
  searchTeams: async (query) => {
    const response = await api.get('/nfl/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get teams by conference
  getTeamsByConference: async (conference) => {
    const response = await api.get('/nfl/teams', {
      params: { conference }
    });
    return response.data;
  },

  // Get teams by division
  getTeamsByDivision: async (conference, division) => {
    const response = await api.get('/nfl/teams', {
      params: { conference, division }
    });
    return response.data;
  },

  // Get live scores (if available)
  getLiveScores: async () => {
    const response = await api.get('/nfl/live-scores');
    return response.data;
  },

  // Get weekly results
  getWeeklyResults: async (week, year = new Date().getFullYear()) => {
    const response = await api.get('/nfl/weekly-results', {
      params: { week, year }
    });
    return response.data;
  },

  // Get season summary
  getSeasonSummary: async (year = new Date().getFullYear()) => {
    const response = await api.get('/nfl/season-summary', {
      params: { year }
    });
    return response.data;
  },

  // Get playoff bracket
  getPlayoffBracket: async (year = new Date().getFullYear()) => {
    const response = await api.get('/nfl/playoff-bracket', {
      params: { year }
    });
    return response.data;
  },

  // Get team performance metrics
  getTeamPerformance: async (teamId, params = {}) => {
    const response = await api.get(`/nfl/teams/${teamId}/performance`, { params });
    return response.data;
  },

  // Get head-to-head records
  getHeadToHead: async (team1Id, team2Id) => {
    const response = await api.get('/nfl/head-to-head', {
      params: { team1: team1Id, team2: team2Id }
    });
    return response.data;
  },

  // Get division standings
  getDivisionStandings: async (conference, division) => {
    const response = await api.get('/nfl/division-standings', {
      params: { conference, division }
    });
    return response.data;
  },

  // Get team news/updates (if implemented)
  getTeamNews: async (teamId, params = {}) => {
    const response = await api.get(`/nfl/teams/${teamId}/news`, { params });
    return response.data;
  },

  // Get injury reports (if implemented)
  getInjuryReports: async (teamId) => {
    const response = await api.get(`/nfl/teams/${teamId}/injuries`);
    return response.data;
  },

  // Get team roster (if implemented)
  getTeamRoster: async (teamId) => {
    const response = await api.get(`/nfl/teams/${teamId}/roster`);
    return response.data;
  },
};
