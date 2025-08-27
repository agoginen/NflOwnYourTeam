import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leagueService } from '../../services/leagueService';
import toast from 'react-hot-toast';

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
      state.currentLeague = action.payload;
    },
    clearCurrentLeague: (state) => {
      state.currentLeague = null;
      state.standings = null;
    },
    updateLeagueInList: (state, action) => {
      const index = state.leagues.findIndex(league => league._id === action.payload._id);
      if (index !== -1) {
        state.leagues[index] = action.payload;
      }
    },
    addLeagueToList: (state, action) => {
      state.leagues.unshift(action.payload);
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
        state.leagues = action.payload.docs || action.payload;
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
        state.currentLeague = action.payload;
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
        state.leagues.unshift(action.payload);
        state.currentLeague = action.payload;
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
