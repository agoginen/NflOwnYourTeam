import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nflService } from '../../services/nflService';

// Sanitize NFL team object to remove virtual properties and ensure React-safe values
const sanitizeNFLTeam = (teamData) => {
  if (!teamData || typeof teamData !== 'object') return teamData;
  
  const {
    // Remove virtual properties that cause React rendering issues
    fullName,
    record,
    winPercentage,
    divisionInfo,
    id, // Remove Mongoose virtual id
    // Keep only serializable properties
    ...sanitized
  } = teamData;
  
  // Ensure string values are properly converted
  if (sanitized.name !== undefined) {
    sanitized.name = String(sanitized.name);
  }
  if (sanitized.city !== undefined) {
    sanitized.city = String(sanitized.city);
  }
  if (sanitized.abbreviation !== undefined) {
    sanitized.abbreviation = String(sanitized.abbreviation);
  }
  if (sanitized.conference !== undefined) {
    sanitized.conference = String(sanitized.conference);
  }
  if (sanitized.division !== undefined) {
    sanitized.division = String(sanitized.division);
  }
  
  return sanitized;
};

// Sanitize NFL teams array
const sanitizeNFLTeams = (teamsData) => {
  if (!Array.isArray(teamsData)) return teamsData;
  return teamsData.map(team => sanitizeNFLTeam(team));
};

// Initial state
const initialState = {
  teams: [],
  standings: null,
  playoffTeams: [],
  currentWeek: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchNFLTeams = createAsyncThunk(
  'nfl/fetchTeams',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await nflService.getTeams(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch NFL teams';
      return rejectWithValue(message);
    }
  }
);

export const fetchNFLStandings = createAsyncThunk(
  'nfl/fetchStandings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await nflService.getStandings(params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch standings';
      return rejectWithValue(message);
    }
  }
);

export const fetchPlayoffTeams = createAsyncThunk(
  'nfl/fetchPlayoffTeams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await nflService.getPlayoffTeams();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch playoff teams';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentWeek = createAsyncThunk(
  'nfl/fetchCurrentWeek',
  async (_, { rejectWithValue }) => {
    try {
      const response = await nflService.getCurrentWeek();
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch current week';
      return rejectWithValue(message);
    }
  }
);

export const fetchTeamStats = createAsyncThunk(
  'nfl/fetchTeamStats',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await nflService.getTeamStats(teamId);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch team stats';
      return rejectWithValue(message);
    }
  }
);

export const fetchTeamSchedule = createAsyncThunk(
  'nfl/fetchTeamSchedule',
  async ({ teamId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await nflService.getTeamSchedule(teamId, params);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch team schedule';
      return rejectWithValue(message);
    }
  }
);

export const searchTeams = createAsyncThunk(
  'nfl/searchTeams',
  async (query, { rejectWithValue }) => {
    try {
      const response = await nflService.searchTeams(query);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to search teams';
      return rejectWithValue(message);
    }
  }
);

// NFL slice
const nflSlice = createSlice({
  name: 'nfl',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTeam: (state, action) => {
      const teamIndex = state.teams.findIndex(team => team._id === action.payload._id);
      if (teamIndex !== -1) {
        state.teams[teamIndex] = sanitizeNFLTeam(action.payload);
      }
    },
    setCurrentWeek: (state, action) => {
      state.currentWeek = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch NFL teams
      .addCase(fetchNFLTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNFLTeams.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array and grouped data structures
        if (Array.isArray(action.payload)) {
          state.teams = sanitizeNFLTeams(action.payload);
        } else {
          // Flatten grouped data
          const teams = [];
          Object.values(action.payload).forEach(conference => {
            Object.values(conference).forEach(division => {
              teams.push(...division);
            });
          });
          state.teams = sanitizeNFLTeams(teams);
        }
        state.error = null;
      })
      .addCase(fetchNFLTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch standings
      .addCase(fetchNFLStandings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNFLStandings.fulfilled, (state, action) => {
        state.loading = false;
        state.standings = action.payload;
        state.error = null;
      })
      .addCase(fetchNFLStandings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch playoff teams
      .addCase(fetchPlayoffTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayoffTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.playoffTeams = action.payload;
        state.error = null;
      })
      .addCase(fetchPlayoffTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch current week
      .addCase(fetchCurrentWeek.fulfilled, (state, action) => {
        state.currentWeek = action.payload;
      })
      
      // Other cases don't need loading states as they're typically quick
      .addCase(fetchTeamStats.fulfilled, (state, action) => {
        // Could store team stats if needed
      })
      .addCase(fetchTeamSchedule.fulfilled, (state, action) => {
        // Could store team schedule if needed
      })
      .addCase(searchTeams.fulfilled, (state, action) => {
        // Search results could be stored separately if needed
      });
  },
});

export const {
  clearError,
  updateTeam,
  setCurrentWeek,
} = nflSlice.actions;

// Selectors
export const selectNFLTeams = (state) => state.nfl.teams;
export const selectNFLStandings = (state) => state.nfl.standings;
export const selectPlayoffTeams = (state) => state.nfl.playoffTeams;
export const selectCurrentWeek = (state) => state.nfl.currentWeek;
export const selectNFLLoading = (state) => state.nfl.loading;
export const selectNFLError = (state) => state.nfl.error;

// Computed selectors
export const selectTeamsByConference = (state) => {
  const teams = state.nfl.teams;
  const grouped = {
    AFC: { North: [], South: [], East: [], West: [] },
    NFC: { North: [], South: [], East: [], West: [] }
  };
  
  teams.forEach(team => {
    if (grouped[team.conference] && grouped[team.conference][team.division]) {
      grouped[team.conference][team.division].push(team);
    }
  });
  
  return grouped;
};

export const selectTeamById = (teamId) => (state) => {
  return state.nfl.teams.find(team => team._id === teamId);
};

export const selectTeamsByDivision = (conference, division) => (state) => {
  return state.nfl.teams.filter(team => 
    team.conference === conference && team.division === division
  );
};

export default nflSlice.reducer;
