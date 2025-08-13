const mongoose = require('mongoose');

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
    unique: true,
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
      default: () => new Date().getFullYear()
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  auctionSettings: {
    startingBudget: {
      type: Number,
      required: true,
      default: 1000,
      min: 100
    },
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
    regularSeasonWin: {
      type: Number,
      required: true,
      default: 2.0, // percentage
      min: 0,
      max: 100
    },
    wildCardWin: {
      type: Number,
      required: true,
      default: 5.0,
      min: 0,
      max: 100
    },
    divisionalWin: {
      type: Number,
      required: true,
      default: 8.0,
      min: 0,
      max: 100
    },
    conferenceChampionshipWin: {
      type: Number,
      required: true,
      default: 15.0,
      min: 0,
      max: 100
    },
    superBowlAppearance: {
      type: Number,
      required: true,
      default: 25.0,
      min: 0,
      max: 100
    },
    superBowlWin: {
      type: Number,
      required: true,
      default: 45.0,
      min: 0,
      max: 100
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
leagueSchema.index({ inviteCode: 1 });
leagueSchema.index({ creator: 1 });
leagueSchema.index({ 'members.user': 1 });
leagueSchema.index({ status: 1 });
leagueSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate total prize pool
leagueSchema.pre('save', function(next) {
  if (this.isModified('teams') || this.isModified('auctionSettings.startingBudget')) {
    this.totalPrizePool = this.memberCount * this.auctionSettings.startingBudget;
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
  const totalPercentage = Object.values(this.payoutStructure).reduce((sum, val) => sum + val, 0);
  return totalPercentage <= 100;
};

module.exports = mongoose.model('League', leagueSchema);
