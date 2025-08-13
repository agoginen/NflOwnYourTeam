import api from './api';

export const leagueService = {
  // Get all leagues for user
  getLeagues: async (params = {}) => {
    const response = await api.get('/leagues', { params });
    return response.data;
  },

  // Get single league
  getLeague: async (leagueId) => {
    const response = await api.get(`/leagues/${leagueId}`);
    return response.data;
  },

  // Create new league
  createLeague: async (leagueData) => {
    const response = await api.post('/leagues', leagueData);
    return response.data;
  },

  // Update league
  updateLeague: async (leagueId, updateData) => {
    const response = await api.put(`/leagues/${leagueId}`, updateData);
    return response.data;
  },

  // Join league with invite code
  joinLeague: async (inviteCode) => {
    const response = await api.post('/leagues/join', { inviteCode });
    return response.data;
  },

  // Leave league
  leaveLeague: async (leagueId) => {
    const response = await api.post(`/leagues/${leagueId}/leave`);
    return response.data;
  },

  // Delete league
  deleteLeague: async (leagueId) => {
    const response = await api.delete(`/leagues/${leagueId}`);
    return response.data;
  },

  // Remove member from league
  removeMember: async (leagueId, memberId) => {
    const response = await api.delete(`/leagues/${leagueId}/members/${memberId}`);
    return response.data;
  },

  // Get league standings
  getStandings: async (leagueId) => {
    const response = await api.get(`/leagues/${leagueId}/standings`);
    return response.data;
  },

  // Get league members
  getMembers: async (leagueId) => {
    const response = await api.get(`/leagues/${leagueId}/members`);
    return response.data;
  },

  // Get league activity/history
  getActivity: async (leagueId, params = {}) => {
    const response = await api.get(`/leagues/${leagueId}/activity`, { params });
    return response.data;
  },

  // Update league settings
  updateSettings: async (leagueId, settings) => {
    const response = await api.put(`/leagues/${leagueId}/settings`, settings);
    return response.data;
  },

  // Update payout structure
  updatePayoutStructure: async (leagueId, payoutStructure) => {
    const response = await api.put(`/leagues/${leagueId}/payout`, { payoutStructure });
    return response.data;
  },

  // Invite member (generate invite link)
  generateInvite: async (leagueId) => {
    const response = await api.post(`/leagues/${leagueId}/invite`);
    return response.data;
  },

  // Get league stats
  getLeagueStats: async (leagueId) => {
    const response = await api.get(`/leagues/${leagueId}/stats`);
    return response.data;
  },

  // Get weekly earnings for league
  getWeeklyEarnings: async (leagueId, week) => {
    const response = await api.get(`/leagues/${leagueId}/earnings`, {
      params: { week }
    });
    return response.data;
  },

  // Get league transactions (team purchases, etc.)
  getTransactions: async (leagueId, params = {}) => {
    const response = await api.get(`/leagues/${leagueId}/transactions`, { params });
    return response.data;
  },

  // Search leagues (public leagues if implemented)
  searchLeagues: async (query, params = {}) => {
    const response = await api.get('/leagues/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Get featured/public leagues
  getFeaturedLeagues: async (params = {}) => {
    const response = await api.get('/leagues/featured', { params });
    return response.data;
  },

  // Get league templates (predefined settings)
  getLeagueTemplates: async () => {
    const response = await api.get('/leagues/templates');
    return response.data;
  },

  // Clone league settings from another league
  cloneLeague: async (sourceLeagueId, newLeagueData) => {
    const response = await api.post(`/leagues/${sourceLeagueId}/clone`, newLeagueData);
    return response.data;
  },

  // Get league performance summary
  getPerformanceSummary: async (leagueId) => {
    const response = await api.get(`/leagues/${leagueId}/performance`);
    return response.data;
  },

  // Export league data
  exportLeagueData: async (leagueId, format = 'json') => {
    const response = await api.get(`/leagues/${leagueId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get league payout summary
  getPayoutSummary: async (leagueId) => {
    const response = await api.get(`/leagues/${leagueId}/payouts`);
    return response.data;
  },
};
