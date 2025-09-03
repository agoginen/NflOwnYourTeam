import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { auctionService } from '../../services/auctionService';
import toast from 'react-hot-toast';

// Sanitize auction object to remove virtual properties and ensure React-safe values
const sanitizeAuction = (auctionData) => {
  if (!auctionData || typeof auctionData !== 'object') return auctionData;
  
  const {
    // Remove virtual properties that cause React rendering issues
    progress,
    remainingTeams,
    activeParticipants,
    timeRemaining,
    // Keep only serializable properties
    ...sanitized
  } = auctionData;
  
  // Ensure all numeric values are properly converted
  if (sanitized.currentBid !== undefined) {
    sanitized.currentBid = Number(sanitized.currentBid) || 0;
  }
  if (sanitized.minBid !== undefined) {
    sanitized.minBid = Number(sanitized.minBid) || 1;
  }
  
  // Ensure all string values are properly converted
  if (sanitized.status !== undefined) {
    sanitized.status = String(sanitized.status);
  }
  
  // Sanitize nested objects
  if (sanitized.league && typeof sanitized.league === 'object') {
    sanitized.league = {
      ...sanitized.league,
      name: String(sanitized.league.name || ''),
    };
  }
  
  if (sanitized.currentTeam && typeof sanitized.currentTeam === 'object') {
    sanitized.currentTeam = {
      ...sanitized.currentTeam,
      name: String(sanitized.currentTeam.name || ''),
      city: String(sanitized.currentTeam.city || ''),
      abbreviation: String(sanitized.currentTeam.abbreviation || ''),
      conference: String(sanitized.currentTeam.conference || ''),
      division: String(sanitized.currentTeam.division || ''),
    };
  }
  
  if (sanitized.currentHighBidder && typeof sanitized.currentHighBidder === 'object') {
    sanitized.currentHighBidder = {
      ...sanitized.currentHighBidder,
      username: String(sanitized.currentHighBidder.username || ''),
    };
  }
  
  // Sanitize arrays
  if (Array.isArray(sanitized.participants)) {
    sanitized.participants = sanitized.participants.map(participant => ({
      ...participant,
      username: String(participant?.username || ''),
    }));
  }
  
  if (Array.isArray(sanitized.teams)) {
    sanitized.teams = sanitized.teams.map(team => ({
      ...team,
      finalPrice: Number(team?.finalPrice) || 0,
      nflTeam: team?.nflTeam ? {
        ...team.nflTeam,
        name: String(team.nflTeam.name || ''),
        city: String(team.nflTeam.city || ''),
        abbreviation: String(team.nflTeam.abbreviation || ''),
      } : null,
      soldTo: team?.soldTo ? {
        ...team.soldTo,
        username: String(team.soldTo.username || ''),
      } : null,
    }));
  }
  
  return sanitized;
};

// Initial state
const initialState = {
  currentAuction: null,
  bids: [],
  participantBudget: null,
  loading: false,
  error: null,
  bidLoading: false,
  nominateLoading: false,
};

// Async thunks
export const fetchAuction = createAsyncThunk(
  'auctions/fetchAuction',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await auctionService.getAuction(auctionId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch auction';
      return rejectWithValue(message);
    }
  }
);

export const createAuction = createAsyncThunk(
  'auctions/createAuction',
  async (auctionData, { rejectWithValue }) => {
    try {
      const response = await auctionService.createAuction(auctionData);
      toast.success('Auction created successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create auction';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const startAuction = createAsyncThunk(
  'auctions/startAuction',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await auctionService.startAuction(auctionId);
      toast.success('Auction started!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start auction';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const nominateTeam = createAsyncThunk(
  'auctions/nominateTeam',
  async ({ auctionId, teamId, startingBid }, { rejectWithValue }) => {
    try {
      const response = await auctionService.nominateTeam(auctionId, teamId, startingBid);
      toast.success('Team nominated successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to nominate team';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const placeBid = createAsyncThunk(
  'auctions/placeBid',
  async ({ auctionId, teamId, bidAmount }, { rejectWithValue }) => {
    try {
      const response = await auctionService.placeBid(auctionId, teamId, bidAmount);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to place bid';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const pauseAuction = createAsyncThunk(
  'auctions/pauseAuction',
  async ({ auctionId, reason }, { rejectWithValue }) => {
    try {
      const response = await auctionService.pauseAuction(auctionId, reason);
      toast.success('Auction paused');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to pause auction';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const resumeAuction = createAsyncThunk(
  'auctions/resumeAuction',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await auctionService.resumeAuction(auctionId);
      toast.success('Auction resumed');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resume auction';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchAuctionBids = createAsyncThunk(
  'auctions/fetchBids',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await auctionService.getAuctionBids(auctionId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch bids';
      return rejectWithValue(message);
    }
  }
);

export const fetchParticipantBudget = createAsyncThunk(
  'auctions/fetchBudget',
  async (auctionId, { rejectWithValue }) => {
    try {
      const response = await auctionService.getParticipantBudget(auctionId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch budget';
      return rejectWithValue(message);
    }
  }
);

// Auction slice
const auctionSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAuction: (state, action) => {
      state.currentAuction = sanitizeAuction(action.payload);
    },
    clearCurrentAuction: (state) => {
      state.currentAuction = null;
      state.bids = [];
      state.participantBudget = null;
    },
    updateAuctionStatus: (state, action) => {
      if (state.currentAuction) {
        state.currentAuction.status = action.payload;
      }
    },
    updateCurrentTeam: (state, action) => {
      if (state.currentAuction) {
        state.currentAuction.currentTeam = action.payload.team;
        state.currentAuction.currentBid = action.payload.bid;
        state.currentAuction.currentHighBidder = action.payload.bidder;
        state.currentAuction.bidEndTime = action.payload.bidEndTime;
      }
    },
    updateBidTimer: (state, action) => {
      if (state.currentAuction) {
        state.currentAuction.bidEndTime = action.payload;
      }
    },
    addBid: (state, action) => {
      state.bids.unshift(action.payload);
      // Update current auction if it's for the current team
      if (state.currentAuction && 
          state.currentAuction.currentTeam && 
          state.currentAuction.currentTeam._id === action.payload.team._id) {
        state.currentAuction.currentBid = action.payload.amount;
        state.currentAuction.currentHighBidder = action.payload.bidder;
      }
    },
    completeTeamSale: (state, action) => {
      if (state.currentAuction) {
        // Update the team in the auction
        const teamIndex = state.currentAuction.teams.findIndex(
          team => team.nflTeam._id === action.payload.team._id
        );
        if (teamIndex !== -1) {
          state.currentAuction.teams[teamIndex].status = 'sold';
          state.currentAuction.teams[teamIndex].soldTo = action.payload.winner;
          state.currentAuction.teams[teamIndex].finalPrice = action.payload.finalPrice;
        }
        
        // Update participant budget
        if (state.participantBudget && 
            state.participantBudget.user === action.payload.winner._id) {
          state.participantBudget.spent += action.payload.finalPrice;
          state.participantBudget.remaining -= action.payload.finalPrice;
          state.participantBudget.teamsOwned += 1;
        }
        
        // Clear current team
        state.currentAuction.currentTeam = null;
        state.currentAuction.currentBid = 0;
        state.currentAuction.currentHighBidder = null;
        state.currentAuction.bidEndTime = null;
      }
    },
    updateNextNominator: (state, action) => {
      if (state.currentAuction) {
        state.currentAuction.currentNominator = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch auction
      .addCase(fetchAuction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAuction = sanitizeAuction(action.payload);
        state.error = null;
      })
      .addCase(fetchAuction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create auction
      .addCase(createAuction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAuction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAuction = sanitizeAuction(action.payload);
        state.error = null;
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Start auction
      .addCase(startAuction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startAuction.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentAuction) {
          state.currentAuction.status = 'active';
          state.currentAuction.startTime = new Date();
        }
        state.error = null;
      })
      .addCase(startAuction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Nominate team
      .addCase(nominateTeam.pending, (state) => {
        state.nominateLoading = true;
        state.error = null;
      })
      .addCase(nominateTeam.fulfilled, (state, action) => {
        state.nominateLoading = false;
        if (state.currentAuction) {
          state.currentAuction.currentTeam = action.payload.auction.currentTeam;
          state.currentAuction.currentBid = action.payload.auction.currentBid;
          state.currentAuction.currentHighBidder = action.payload.auction.currentHighBidder;
          state.currentAuction.bidEndTime = action.payload.auction.bidEndTime;
        }
        state.error = null;
      })
      .addCase(nominateTeam.rejected, (state, action) => {
        state.nominateLoading = false;
        state.error = action.payload;
      })
      
      // Place bid
      .addCase(placeBid.pending, (state) => {
        state.bidLoading = true;
        state.error = null;
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        state.bidLoading = false;
        if (state.currentAuction) {
          state.currentAuction.currentBid = action.payload.currentBid;
          state.currentAuction.currentHighBidder = action.payload.currentHighBidder;
          state.currentAuction.bidEndTime = action.payload.bidEndTime;
        }
        state.error = null;
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.bidLoading = false;
        state.error = action.payload;
      })
      
      // Pause/Resume auction
      .addCase(pauseAuction.fulfilled, (state) => {
        if (state.currentAuction) {
          state.currentAuction.status = 'paused';
        }
      })
      .addCase(resumeAuction.fulfilled, (state) => {
        if (state.currentAuction) {
          state.currentAuction.status = 'active';
        }
      })
      
      // Fetch bids
      .addCase(fetchAuctionBids.fulfilled, (state, action) => {
        state.bids = action.payload.bids;
      })
      
      // Fetch budget
      .addCase(fetchParticipantBudget.fulfilled, (state, action) => {
        state.participantBudget = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentAuction,
  clearCurrentAuction,
  updateAuctionStatus,
  updateCurrentTeam,
  updateBidTimer,
  addBid,
  completeTeamSale,
  updateNextNominator,
} = auctionSlice.actions;

// Base selectors
const selectAuctionState = (state) => state.auctions;

// Memoized selectors
export const selectCurrentAuction = createSelector(
  [selectAuctionState],
  (auctions) => auctions.currentAuction
);

export const selectAuctionBids = createSelector(
  [selectAuctionState],
  (auctions) => auctions.bids
);

export const selectParticipantBudget = createSelector(
  [selectAuctionState],
  (auctions) => auctions.participantBudget
);

export const selectAuctionLoading = createSelector(
  [selectAuctionState],
  (auctions) => auctions.loading
);

export const selectBidLoading = createSelector(
  [selectAuctionState],
  (auctions) => auctions.bidLoading
);

export const selectNominateLoading = createSelector(
  [selectAuctionState],
  (auctions) => auctions.nominateLoading
);

export const selectAuctionError = createSelector(
  [selectAuctionState],
  (auctions) => auctions.error
);

export default auctionSlice.reducer;
