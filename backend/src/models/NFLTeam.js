const mongoose = require('mongoose');

const nflTeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Team city is required'],
    trim: true
  },
  abbreviation: {
    type: String,
    required: [true, 'Team abbreviation is required'],
    uppercase: true,
    length: 3
  },
  conference: {
    type: String,
    required: [true, 'Conference is required'],
    enum: ['AFC', 'NFC']
  },
  division: {
    type: String,
    required: [true, 'Division is required'],
    enum: ['North', 'South', 'East', 'West']
  },
  colors: {
    primary: {
      type: String,
      required: true
    },
    secondary: {
      type: String,
      required: true
    }
  },
  logo: {
    type: String,
    required: true
  },
  established: {
    type: Number,
    required: true
  },
  stadium: {
    name: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      required: true
    }
  },
  currentSeason: {
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear()
    },
    wins: {
      type: Number,
      default: 0,
      min: 0
    },
    losses: {
      type: Number,
      default: 0,
      min: 0
    },
    ties: {
      type: Number,
      default: 0,
      min: 0
    },
    playoffStatus: {
      type: String,
      enum: ['none', 'wildcard', 'divisional', 'conference', 'superbowl', 'champion'],
      default: 'none'
    },
    isEliminated: {
      type: Boolean,
      default: false
    },
    divisionRank: {
      type: Number,
      min: 1,
      max: 4,
      default: null
    },
    conferenceRank: {
      type: Number,
      min: 1,
      max: 16,
      default: null
    }
  },
  weeklyResults: [{
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 22 // Including playoffs
    },
    opponent: {
      type: String,
      required: true
    },
    isHome: {
      type: Boolean,
      required: true
    },
    result: {
      type: String,
      enum: ['W', 'L', 'T'],
      default: null
    },
    score: {
      team: {
        type: Number,
        default: null
      },
      opponent: {
        type: Number,
        default: null
      }
    },
    isPlayoff: {
      type: Boolean,
      default: false
    },
    playoffRound: {
      type: String,
      enum: ['wildcard', 'divisional', 'conference', 'superbowl'],
      default: null
    },
    gameDate: {
      type: Date,
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  allTimeStats: {
    totalWins: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    },
    totalTies: {
      type: Number,
      default: 0
    },
    playoffAppearances: {
      type: Number,
      default: 0
    },
    superbowlAppearances: {
      type: Number,
      default: 0
    },
    superbowlWins: {
      type: Number,
      default: 0
    },
    divisionTitles: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  externalIds: {
    espnId: String,
    nflId: String,
    sportsDataId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full team name
nflTeamSchema.virtual('fullName').get(function() {
  return `${this.city} ${this.name}`;
});

// Virtual for current record
nflTeamSchema.virtual('record').get(function() {
  const { wins, losses, ties } = this.currentSeason;
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
});

// Virtual for win percentage
nflTeamSchema.virtual('winPercentage').get(function() {
  const { wins, losses, ties } = this.currentSeason;
  const totalGames = wins + losses + ties;
  if (totalGames === 0) return 0;
  return ((wins + (ties * 0.5)) / totalGames * 100).toFixed(1);
});

// Virtual for division and conference info
nflTeamSchema.virtual('divisionInfo').get(function() {
  return `${this.conference} ${this.division}`;
});

// Indexes for better performance
nflTeamSchema.index({ abbreviation: 1 }, { unique: true });
nflTeamSchema.index({ conference: 1, division: 1 });
nflTeamSchema.index({ 'currentSeason.year': 1 });
nflTeamSchema.index({ 'currentSeason.wins': -1 });
nflTeamSchema.index({ 'currentSeason.playoffStatus': 1 });

// Method to update weekly result
nflTeamSchema.methods.updateWeeklyResult = function(week, result, teamScore, opponentScore, opponent, isHome, gameDate, isPlayoff = false, playoffRound = null) {
  const existingResult = this.weeklyResults.find(r => r.week === week && r.isPlayoff === isPlayoff);
  
  if (existingResult) {
    // Update existing result
    existingResult.result = result;
    existingResult.score.team = teamScore;
    existingResult.score.opponent = opponentScore;
    existingResult.lastUpdated = new Date();
  } else {
    // Add new result
    this.weeklyResults.push({
      week,
      opponent,
      isHome,
      result,
      score: {
        team: teamScore,
        opponent: opponentScore
      },
      isPlayoff,
      playoffRound,
      gameDate,
      lastUpdated: new Date()
    });
  }
  
  // Update season totals
  this.updateSeasonTotals();
  return this;
};

// Method to update season totals
nflTeamSchema.methods.updateSeasonTotals = function() {
  const regularSeasonResults = this.weeklyResults.filter(r => !r.isPlayoff && r.result);
  
  this.currentSeason.wins = regularSeasonResults.filter(r => r.result === 'W').length;
  this.currentSeason.losses = regularSeasonResults.filter(r => r.result === 'L').length;
  this.currentSeason.ties = regularSeasonResults.filter(r => r.result === 'T').length;
  
  return this;
};

// Method to get playoff earnings multiplier
nflTeamSchema.methods.getPlayoffMultiplier = function() {
  switch (this.currentSeason.playoffStatus) {
    case 'wildcard':
      return 1.2;
    case 'divisional':
      return 1.5;
    case 'conference':
      return 2.0;
    case 'superbowl':
      return 3.0;
    case 'champion':
      return 5.0;
    default:
      return 1.0;
  }
};

// Static method to get teams by division
nflTeamSchema.statics.getByDivision = function(conference, division) {
  return this.find({ conference, division, isActive: true }).sort({ 'currentSeason.wins': -1 });
};

// Static method to get playoff teams
nflTeamSchema.statics.getPlayoffTeams = function() {
  return this.find({ 
    'currentSeason.playoffStatus': { $ne: 'none' },
    isActive: true 
  }).sort({ 'currentSeason.playoffStatus': 1 });
};

// Static method to reset season
nflTeamSchema.statics.resetSeason = async function(year) {
  return this.updateMany(
    { isActive: true },
    {
      $set: {
        'currentSeason.year': year,
        'currentSeason.wins': 0,
        'currentSeason.losses': 0,
        'currentSeason.ties': 0,
        'currentSeason.playoffStatus': 'none',
        'currentSeason.isEliminated': false,
        'currentSeason.divisionRank': null,
        'currentSeason.conferenceRank': null
      },
      $unset: {
        weeklyResults: 1
      }
    }
  );
};

module.exports = mongoose.model('NFLTeam', nflTeamSchema);
