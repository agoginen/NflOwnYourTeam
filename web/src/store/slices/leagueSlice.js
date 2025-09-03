import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leagueService } from '../../services/leagueService';
import toast from 'react-hot-toast';

// Sanitize league object to remove virtual properties and ensure React-safe values
const sanitizeLeague = (leagueData) => {
  if (!leagueData || typeof leagueData !== 'object') return leagueData;
  
  const {
    // Remove virtual properties that cause React rendering issues
    memberCount,
    availableSpots,
    isFull,
    canStartAuction,
    id, // Remove Mongoose virtual id
    // Keep only serializable properties
    ...sanitized
  } = leagueData;
  
  // Ensure string values are properly converted
  if (sanitized.name !== undefined) {
    sanitized.name = String(sanitized.name);
  }
  if (sanitized.status !== undefined) {
    sanitized.status = String(sanitized.status);
  }
  if (sanitized.inviteCode !== undefined) {
    sanitized.inviteCode = String(sanitized.inviteCode);
  }
  
  // Sanitize creator
  if (sanitized.creator && typeof sanitized.creator === 'object') {
    const { fullName, id: creatorId, ...creatorClean } = sanitized.creator;
    sanitized.creator = {
      ...creatorClean,
      username: String(sanitized.creator.username || ''),
      firstName: String(sanitized.creator.firstName || ''),
      lastName: String(sanitized.creator.lastName || ''),
    };
  }
  
  // Sanitize auction reference - ensure it's either a string ID or properly sanitized object
  if (sanitized.auction && typeof sanitized.auction === 'object') {
    // If auction is populated, extract just the ID
    sanitized.auction = sanitized.auction._id || sanitized.auction;
  }
  
  // Sanitize members array
  if (Array.isArray(sanitized.members)) {
    sanitized.members = sanitized.members.map(member => {
      const cleanMember = { ...member };
      if (cleanMember.user && typeof cleanMember.user === 'object') {
        const { fullName, id: userId, ...userClean } = cleanMember.user;
        cleanMember.user = {
          ...userClean,
          username: String(cleanMember.user.username || ''),
          firstName: String(cleanMember.user.firstName || ''),
          lastName: String(cleanMember.user.lastName || ''),
        };
      }
      return cleanMember;
    });
  }
  
  // Sanitize teams array
  if (Array.isArray(sanitized.teams)) {
    sanitized.teams = sanitized.teams.map(team => {
      const cleanTeam = { ...team };
      if (cleanTeam.nflTeam && typeof cleanTeam.nflTeam === 'object') {
        const { fullName, record, winPercentage, divisionInfo, id: teamId, ...nflTeamClean } = cleanTeam.nflTeam;
        cleanTeam.nflTeam = {
          ...nflTeamClean,
          name: String(cleanTeam.nflTeam.name || ''),
          city: String(cleanTeam.nflTeam.city || ''),
          abbreviation: String(cleanTeam.nflTeam.abbreviation || ''),
        };
      }
      if (cleanTeam.owner && typeof cleanTeam.owner === 'object') {
        const { fullName, id: ownerId, ...ownerClean } = cleanTeam.owner;
        cleanTeam.owner = {
          ...ownerClean,
          username: String(cleanTeam.owner.username || ''),
        };
      }
      return cleanTeam;
    });
  }
  
  return sanitized;
};

// Sanitize leagues array
const sanitizeLeagues = (leaguesData) => {
  if (!Array.isArray(leaguesData)) return leaguesData;
  return leaguesData.map(league => sanitizeLeague(league));
};

// Initial state
const initialState = {
  leagues: [],
  currentLeague: null,
  standings: null,
  loading: false,
  error: null,
  createLoading: false,
  joinLoading: false,
};

// Async thunks
export const fetchLeagues = createAsyncThunk(
  'leagues/fetchLeagues',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await leagueService.getLeagues(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch leagues';
      return rejectWithValue(message);
    }
  }
);

export const fetchLeague = createAsyncThunk(
  'leagues/fetchLeague',
  async (leagueId, { rejectWithValue }) => {
    try {
      const response = await leagueService.getLeague(leagueId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch league';
      return rejectWithValue(message);
    }
  }
);

export const createLeague = createAsyncThunk(
  'leagues/createLeague',
  async (leagueData, { rejectWithValue }) => {
    try {
      const response = await leagueService.createLeague(leagueData);
      toast.success('League created successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create league';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateLeague = createAsyncThunk(
  'leagues/updateLeague',
  async ({ leagueId, updateData }, { rejectWithValue }) => {
    try {
      const response = await leagueService.updateLeague(leagueId, updateData);
      toast.success('League updated successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update league';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const joinLeague = createAsyncThunk(
  'leagues/joinLeague',
  async (inviteCode, { rejectWithValue }) => {
    try {
      const response = await leagueService.joinLeague(inviteCode);
      toast.success('Successfully joined league!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join league';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const leaveLeague = createAsyncThunk(
  'leagues/leaveLeague',
  async (leagueId, { rejectWithValue }) => {
    try {
      await leagueService.leaveLeague(leagueId);
      toast.success('Left league successfully');
      return leagueId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to leave league';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteLeague = createAsyncThunk(
  'leagues/deleteLeague',
  async (leagueId, { rejectWithValue }) => {
    try {
      await leagueService.deleteLeague(leagueId);
      toast.success('League deleted successfully');
      return leagueId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete league';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeMember = createAsyncThunk(
  'leagues/removeMember',
  async ({ leagueId, memberId }, { rejectWithValue }) => {
    try {
      await leagueService.removeMember(leagueId, memberId);
      toast.success('Member removed successfully');
      return { leagueId, memberId };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove member';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchStandings = createAsyncThunk(
  'leagues/fetchStandings',
  async (leagueId, { rejectWithValue }) => {
    try {
      const response = await leagueService.getStandings(leagueId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch standings';
      return rejectWithValue(message);
    }
  }
);

// League slice
const leagueSlice = createSlice({
  name: 'leagues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLeague: (state, action) => {
      state.currentLeague = sanitizeLeague(action.payload);
    },
    clearCurrentLeague: (state) => {
      state.currentLeague = null;
      state.standings = null;
    },
    updateLeagueInList: (state, action) => {
      const index = state.leagues.findIndex(league => league._id === action.payload._id);
      if (index !== -1) {
        state.leagues[index] = sanitizeLeague(action.payload);
      }
    },
    addLeagueToList: (state, action) => {
      state.leagues.unshift(sanitizeLeague(action.payload));
    },
    removeLeagueFromList: (state, action) => {
      state.leagues = state.leagues.filter(league => league._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leagues
      .addCase(fetchLeagues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeagues.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues = sanitizeLeagues(action.payload.docs || action.payload);
        state.error = null;
      })
      .addCase(fetchLeagues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch single league
      .addCase(fetchLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeague.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLeague = sanitizeLeague(action.payload);
        state.error = null;
      })
      .addCase(fetchLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create league
      .addCase(createLeague.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createLeague.fulfilled, (state, action) => {
        state.createLoading = false;
        const sanitizedLeague = sanitizeLeague(action.payload);
        state.leagues.unshift(sanitizedLeague);
        state.currentLeague = sanitizedLeague;
        state.error = null;
      })
      .addCase(createLeague.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      
      // Update league
      .addCase(updateLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeague.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLeague = action.payload;
        
        // Update in leagues list
        const index = state.leagues.findIndex(league => league._id === action.payload._id);
        if (index !== -1) {
          state.leagues[index] = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Join league
      .addCase(joinLeague.pending, (state) => {
        state.joinLoading = true;
        state.error = null;
      })
      .addCase(joinLeague.fulfilled, (state, action) => {
        state.joinLoading = false;
        state.leagues.unshift(action.payload);
        state.error = null;
      })
      .addCase(joinLeague.rejected, (state, action) => {
        state.joinLoading = false;
        state.error = action.payload;
      })
      
      // Leave league
      .addCase(leaveLeague.fulfilled, (state, action) => {
        state.leagues = state.leagues.filter(league => league._id !== action.payload);
        if (state.currentLeague && state.currentLeague._id === action.payload) {
          state.currentLeague = null;
        }
      })
      
      // Delete league
      .addCase(deleteLeague.fulfilled, (state, action) => {
        state.leagues = state.leagues.filter(league => league._id !== action.payload);
        if (state.currentLeague && state.currentLeague._id === action.payload) {
          state.currentLeague = null;
        }
      })
      
      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.currentLeague && state.currentLeague._id === action.payload.leagueId) {
          state.currentLeague.members = state.currentLeague.members.filter(
            member => member.user._id !== action.payload.memberId
          );
        }
      })
      
      // Fetch standings
      .addCase(fetchStandings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandings.fulfilled, (state, action) => {
        state.loading = false;
        state.standings = action.payload;
        state.error = null;
      })
      .addCase(fetchStandings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentLeague,
  clearCurrentLeague,
  updateLeagueInList,
  addLeagueToList,
  removeLeagueFromList,
} = leagueSlice.actions;

// Selectors
export const selectLeagues = (state) => state.leagues.leagues;
export const selectCurrentLeague = (state) => state.leagues.currentLeague;
export const selectStandings = (state) => state.leagues.standings;
export const selectLeagueLoading = (state) => state.leagues.loading;
export const selectCreateLoading = (state) => state.leagues.createLoading;
export const selectJoinLoading = (state) => state.leagues.joinLoading;
export const selectLeagueError = (state) => state.leagues.error;

export default leagueSlice.reducer;
