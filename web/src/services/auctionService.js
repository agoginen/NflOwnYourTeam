import api from './api';

export const auctionService = {
  // Get auction details
  getAuction: async (auctionId) => {
    const response = await api.get(`/auctions/${auctionId}`);
    return response.data;
  },

  // Create auction
  createAuction: async (auctionData) => {
    const response = await api.post('/auctions', auctionData);
    return response.data;
  },

  // Start auction
  startAuction: async (auctionId) => {
    const response = await api.post(`/auctions/${auctionId}/start`);
    return response.data;
  },

  // Nominate team
  nominateTeam: async (auctionId, teamId, startingBid) => {
    const response = await api.post(`/auctions/${auctionId}/nominate`, {
      teamId,
      startingBid
    });
    return response.data;
  },

  // Place bid
  placeBid: async (auctionId, teamId, bidAmount) => {
    const response = await api.post(`/auctions/${auctionId}/bid`, {
      teamId,
      bidAmount
    });
    return response.data;
  },

  // Complete current team auction (auto-triggered)
  completeTeamAuction: async (auctionId) => {
    const response = await api.post(`/auctions/${auctionId}/complete-team`);
    return response.data;
  },

  // Pause auction
  pauseAuction: async (auctionId, reason) => {
    const response = await api.post(`/auctions/${auctionId}/pause`, { reason });
    return response.data;
  },

  // Resume auction
  resumeAuction: async (auctionId) => {
    const response = await api.post(`/auctions/${auctionId}/resume`);
    return response.data;
  },

  // Get auction bids
  getAuctionBids: async (auctionId) => {
    const response = await api.get(`/auctions/${auctionId}/bids`);
    return response.data;
  },

  // Get participant budget info
  getParticipantBudget: async (auctionId) => {
    const response = await api.get(`/auctions/${auctionId}/budget`);
    return response.data;
  },

  // Get auction history
  getAuctionHistory: async (auctionId, params = {}) => {
    const response = await api.get(`/auctions/${auctionId}/history`, { params });
    return response.data;
  },

  // Get auction statistics
  getAuctionStats: async (auctionId) => {
    const response = await api.get(`/auctions/${auctionId}/stats`);
    return response.data;
  },

  // Force complete auction (admin only)
  forceCompleteAuction: async (auctionId) => {
    const response = await api.post(`/auctions/${auctionId}/force-complete`);
    return response.data;
  },

  // Set proxy bid (if implemented)
  setProxyBid: async (auctionId, teamId, maxBid) => {
    const response = await api.post(`/auctions/${auctionId}/proxy-bid`, {
      teamId,
      maxBid
    });
    return response.data;
  },

  // Cancel proxy bid
  cancelProxyBid: async (auctionId, teamId) => {
    const response = await api.delete(`/auctions/${auctionId}/proxy-bid/${teamId}`);
    return response.data;
  },

  // Get available teams for nomination
  getAvailableTeams: async (auctionId) => {
    const response = await api.get(`/auctions/${auctionId}/available-teams`);
    return response.data;
  },

  // Get auction timeline/events
  getAuctionTimeline: async (auctionId) => {
    const response = await api.get(`/auctions/${auctionId}/timeline`);
    return response.data;
  },

  // Export auction results
  exportAuctionResults: async (auctionId, format = 'csv') => {
    const response = await api.get(`/auctions/${auctionId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },
};
