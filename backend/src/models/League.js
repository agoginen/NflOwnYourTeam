const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'League name is required'],
    trim: true,
    minlength: [3, 'League name must be at least 3 characters long'],
    maxlength: [50, 'League name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  inviteCode: {
    type: String,
    required: true,
    length: 8,
    uppercase: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  maxMembers: {
    type: Number,
    default: 32,
    min: 2,
    max: 32
  },
  season: {
    year: {
      type: Number,
      required: true,
      default: 2025 // Default to 2025 for all leagues created now
    }
  },
  auctionSettings: {
    minimumBid: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    bidIncrement: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    auctionTimer: {
      type: Number,
      required: true,
      default: 60, // seconds
      min: 30,
      max: 300
    }
  },
  payoutStructure: {
    regularSeasonWins: {
      type: Number,
      required: true,
      default: 70.0, // percentage of total pool
      min: 0,
      max: 100,
      description: "Percentage of pool distributed among all regular season wins"
    },
    wildCardWin: {
      type: Number,
      required: true,
      default: 2.5,
      min: 0,
      max: 100,
      description: "Percentage per wild card round win"
    },
    divisionalWin: {
      type: Number,
      required: true,
      default: 2.5,
      min: 0,
      max: 100,
      description: "Percentage per divisional round win"
    },
    conferenceChampionshipWin: {
      type: Number,
      required: true,
      default: 2.5,
      min: 0,
      max: 100,
      description: "Percentage per conference championship win"
    },
    superBowlAppearance: {
      type: Number,
      required: true,
      default: 10.0,
      min: 0,
      max: 100,
      description: "Percentage for making Super Bowl"
    },
    superBowlWin: {
      type: Number,
      required: true,
      default: 12.5,
      min: 0,
      max: 100,
      description: "Percentage for winning Super Bowl (remaining share)"
    },
    topTeamsSplit: {
      enabled: {
        type: Boolean,
        default: false,
        description: "Whether to split percentage among top performing teams"
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: "Percentage to split among top teams"
      },
      numberOfTeams: {
        type: Number,
        default: 4,
        min: 1,
        max: 32,
        description: "Number of top teams to split among"
      }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'auction', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    default: null
  },
  teams: [{
    nflTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFLTeam',
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    purchasePrice: {
      type: Number,
      default: 0
    },
    currentEarnings: {
      type: Number,
      default: 0
    },
    seasonStats: {
      wins: {
        type: Number,
        default: 0
      },
      losses: {
        type: Number,
        default: 0
      },
      ties: {
        type: Number,
        default: 0
      },
      playoffResults: {
        wildCardWin: {
          type: Boolean,
          default: false
        },
        divisionalWin: {
          type: Boolean,
          default: false
        },
        conferenceChampionshipWin: {
          type: Boolean,
          default: false
        },
        superBowlAppearance: {
          type: Boolean,
          default: false
        },
        superBowlWin: {
          type: Boolean,
          default: false
        }
      },
      earnings: {
        regularSeasonWins: {
          type: Number,
          default: 0
        },
        wildCard: {
          type: Number,
          default: 0
        },
        divisional: {
          type: Number,
          default: 0
        },
        conferenceChampionship: {
          type: Number,
          default: 0
        },
        superBowlAppearance: {
          type: Number,
          default: 0
        },
        superBowlWin: {
          type: Number,
          default: 0
        },
        topTeamsSplit: {
          type: Number,
          default: 0
        },
        total: {
          type: Number,
          default: 0
        }
      }
    }
  }],
  totalPrizePool: {
    type: Number,
    default: 0
  },
  distributedWinnings: {
    type: Number,
    default: 0
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  settings: {
    allowLateJoins: {
      type: Boolean,
      default: false
    },
    autoStartAuction: {
      type: Boolean,
      default: false
    },
    sendNotifications: {
      type: Boolean,
      default: true
    },
    draftType: {
      type: String,
      enum: ['snake', 'linear'],
      default: 'snake',
      description: "Type of draft order (snake pattern or linear)"
    },
    requireAllTeamsAuctioned: {
      type: Boolean,
      default: true,
      description: "All 32 teams must be auctioned"
    },
    allowSkipNomination: {
      type: Boolean,
      default: false,
      description: "Allow players to skip their nomination turn"
    }
  },
  weeklyUpdates: {
    lastUpdateWeek: {
      type: Number,
      default: 0
    },
    lastUpdateDate: {
      type: Date,
      default: null
    },
    currentWeek: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for member count
leagueSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.filter(member => member.isActive).length : 0;
});

// Virtual for available spots
leagueSchema.virtual('availableSpots').get(function() {
  return this.maxMembers - this.memberCount;
});

// Virtual to check if league is full
leagueSchema.virtual('isFull').get(function() {
  return this.memberCount >= this.maxMembers;
});

// Virtual to check if auction can start
leagueSchema.virtual('canStartAuction').get(function() {
  return this.memberCount >= 2 && this.status === 'draft';
});

// Indexes for better performance
leagueSchema.index({ inviteCode: 1 }, { unique: true });
leagueSchema.index({ creator: 1 });
leagueSchema.index({ 'members.user': 1 });
leagueSchema.index({ status: 1 });
leagueSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate total prize pool
leagueSchema.pre('save', function(next) {
  // Calculate prize pool from actual auction results
  if (this.isModified('teams')) {
    const totalAuctionValue = this.teams.reduce((sum, team) => sum + team.purchasePrice, 0);
    this.totalPrizePool = totalAuctionValue;
  }
  next();
});

// Method to generate unique invite code
leagueSchema.statics.generateInviteCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    exists = await this.findOne({ inviteCode: code });
  }
  
  return code;
};

// Method to add member to league
leagueSchema.methods.addMember = function(userId) {
  if (this.isFull) {
    throw new Error('League is full');
  }
  
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this league');
  }
  
  this.members.push({
    user: userId,
    joinedAt: new Date(),
    isActive: true
  });
  
  return this;
};

// Method to remove member from league
leagueSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString() && member.isActive
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this league');
  }
  
  this.members[memberIndex].isActive = false;
  return this;
};

// Method to validate payout structure
leagueSchema.methods.validatePayoutStructure = function() {
  let totalPercentage = this.payoutStructure.regularSeasonWins +
                       this.payoutStructure.wildCardWin +
                       this.payoutStructure.divisionalWin +
                       this.payoutStructure.conferenceChampionshipWin +
                       this.payoutStructure.superBowlAppearance +
                       this.payoutStructure.superBowlWin;
  
  if (this.payoutStructure.topTeamsSplit.enabled) {
    totalPercentage += this.payoutStructure.topTeamsSplit.percentage;
  }
  
  return totalPercentage <= 100;
};

// Method to calculate regular season win payout per win
leagueSchema.methods.calculateRegularSeasonWinValue = function() {
  if (this.totalPrizePool === 0) return 0;
  
  // Calculate total regular season wins across all teams
  const totalWins = this.teams.reduce((sum, team) => sum + team.seasonStats.wins, 0);
  
  if (totalWins === 0) return 0;
  
  const regularSeasonPool = (this.totalPrizePool * this.payoutStructure.regularSeasonWins) / 100;
  return regularSeasonPool / totalWins;
};

// Method to calculate playoff payout amounts
leagueSchema.methods.calculatePlayoffPayout = function(type) {
  if (this.totalPrizePool === 0) return 0;
  return (this.totalPrizePool * this.payoutStructure[type]) / 100;
};

// Method to update team regular season record
leagueSchema.methods.updateTeamRecord = function(nflTeamId, wins, losses, ties = 0) {
  const team = this.teams.find(t => t.nflTeam.toString() === nflTeamId.toString());
  if (!team) {
    throw new Error('Team not found in league');
  }
  
  // Calculate new wins earned this update
  const newWins = Math.max(0, wins - team.seasonStats.wins);
  
  // Update record
  team.seasonStats.wins = wins;
  team.seasonStats.losses = losses;
  team.seasonStats.ties = ties;
  
  // Calculate and add earnings for new wins
  if (newWins > 0) {
    const winValue = this.calculateRegularSeasonWinValue();
    const newEarnings = newWins * winValue;
    team.seasonStats.earnings.regularSeasonWins += newEarnings;
    team.seasonStats.earnings.total += newEarnings;
    team.currentEarnings = team.seasonStats.earnings.total;
  }
  
  return this;
};

// Method to update team playoff results
leagueSchema.methods.updateTeamPlayoffResult = function(nflTeamId, playoffType, won = true) {
  const team = this.teams.find(t => t.nflTeam.toString() === nflTeamId.toString());
  if (!team) {
    throw new Error('Team not found in league');
  }
  
  const validTypes = ['wildCardWin', 'divisionalWin', 'conferenceChampionshipWin', 'superBowlAppearance', 'superBowlWin'];
  if (!validTypes.includes(playoffType)) {
    throw new Error('Invalid playoff type');
  }
  
  // Update playoff result
  team.seasonStats.playoffResults[playoffType] = won;
  
  if (won) {
    // Calculate payout based on type
    let payoutType;
    switch (playoffType) {
      case 'wildCardWin':
        payoutType = 'wildCardWin';
        break;
      case 'divisionalWin':
        payoutType = 'divisionalWin';
        break;
      case 'conferenceChampionshipWin':
        payoutType = 'conferenceChampionshipWin';
        break;
      case 'superBowlAppearance':
        payoutType = 'superBowlAppearance';
        break;
      case 'superBowlWin':
        payoutType = 'superBowlWin';
        break;
    }
    
    const payout = this.calculatePlayoffPayout(payoutType);
    
    // Map playoff types to earnings fields
    const earningsField = playoffType === 'wildCardWin' ? 'wildCard' :
                         playoffType === 'divisionalWin' ? 'divisional' :
                         playoffType === 'conferenceChampionshipWin' ? 'conferenceChampionship' :
                         playoffType.replace('Win', '').replace('Appearance', 'Appearance');
    
    team.seasonStats.earnings[earningsField] += payout;
    team.seasonStats.earnings.total += payout;
    team.currentEarnings = team.seasonStats.earnings.total;
  }
  
  return this;
};

// Method to distribute top teams split
leagueSchema.methods.distributeTopTeamsSplit = function() {
  if (!this.payoutStructure.topTeamsSplit.enabled) return this;
  
  // Sort teams by total earnings (excluding the split itself)
  const sortedTeams = this.teams
    .filter(team => team.owner) // Only owned teams
    .sort((a, b) => {
      const aEarnings = a.seasonStats.earnings.total - a.seasonStats.earnings.topTeamsSplit;
      const bEarnings = b.seasonStats.earnings.total - b.seasonStats.earnings.topTeamsSplit;
      return bEarnings - aEarnings;
    });
  
  const topTeams = sortedTeams.slice(0, this.payoutStructure.topTeamsSplit.numberOfTeams);
  const splitAmount = (this.totalPrizePool * this.payoutStructure.topTeamsSplit.percentage) / 100;
  const perTeamAmount = splitAmount / topTeams.length;
  
  topTeams.forEach(team => {
    team.seasonStats.earnings.topTeamsSplit = perTeamAmount;
    team.seasonStats.earnings.total += perTeamAmount;
    team.currentEarnings = team.seasonStats.earnings.total;
  });
  
  return this;
};

// Method to recalculate all earnings based on current performance
leagueSchema.methods.recalculateAllEarnings = function() {
  // Reset all earnings
  this.teams.forEach(team => {
    team.seasonStats.earnings = {
      regularSeasonWins: 0,
      wildCard: 0,
      divisional: 0,
      conferenceChampionship: 0,
      superBowlAppearance: 0,
      superBowlWin: 0,
      topTeamsSplit: 0,
      total: 0
    };
    team.currentEarnings = 0;
  });
  
  // Recalculate regular season earnings
  const winValue = this.calculateRegularSeasonWinValue();
  this.teams.forEach(team => {
    if (team.seasonStats.wins > 0) {
      const earnings = team.seasonStats.wins * winValue;
      team.seasonStats.earnings.regularSeasonWins = earnings;
      team.seasonStats.earnings.total += earnings;
    }
  });
  
  // Recalculate playoff earnings
  this.teams.forEach(team => {
    const playoffs = team.seasonStats.playoffResults;
    
    if (playoffs.wildCardWin) {
      const payout = this.calculatePlayoffPayout('wildCardWin');
      team.seasonStats.earnings.wildCard += payout;
      team.seasonStats.earnings.total += payout;
    }
    
    if (playoffs.divisionalWin) {
      const payout = this.calculatePlayoffPayout('divisionalWin');
      team.seasonStats.earnings.divisional += payout;
      team.seasonStats.earnings.total += payout;
    }
    
    if (playoffs.conferenceChampionshipWin) {
      const payout = this.calculatePlayoffPayout('conferenceChampionshipWin');
      team.seasonStats.earnings.conferenceChampionship += payout;
      team.seasonStats.earnings.total += payout;
    }
    
    if (playoffs.superBowlAppearance) {
      const payout = this.calculatePlayoffPayout('superBowlAppearance');
      team.seasonStats.earnings.superBowlAppearance += payout;
      team.seasonStats.earnings.total += payout;
    }
    
    if (playoffs.superBowlWin) {
      const payout = this.calculatePlayoffPayout('superBowlWin');
      team.seasonStats.earnings.superBowlWin += payout;
      team.seasonStats.earnings.total += payout;
    }
    
    team.currentEarnings = team.seasonStats.earnings.total;
  });
  
  // Distribute top teams split
  this.distributeTopTeamsSplit();
  
  return this;
};

// Add pagination plugin
leagueSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('League', leagueSchema);
