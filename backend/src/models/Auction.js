const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  currentTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFLTeam',
    default: null
  },
  currentNominator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentHighBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentBid: {
    type: Number,
    default: 0
  },
  bidTimer: {
    type: Number,
    default: 60 // seconds
  },
  bidEndTime: {
    type: Date,
    default: null
  },
  draftOrder: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    position: {
      type: Number,
      required: true
    }
  }],
  nominationOrder: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    round: {
      type: Number,
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    hasNominated: {
      type: Boolean,
      default: false
    }
  }],
  currentRound: {
    type: Number,
    default: 1
  },
  currentNominationIndex: {
    type: Number,
    default: 0
  },
  teams: [{
    nflTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFLTeam',
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'nominated', 'sold'],
      default: 'available'
    },
    nominatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    finalPrice: {
      type: Number,
      default: 0
    },
    nominatedAt: {
      type: Date,
      default: null
    },
    soldAt: {
      type: Date,
      default: null
    }
  }],
  bids: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFLTeam',
      required: true
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isWinning: {
      type: Boolean,
      default: false
    }
  }],
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    budget: {
      type: Number,
      required: true
    },
    spent: {
      type: Number,
      default: 0
    },
    teamsOwned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFLTeam'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    minimumBid: {
      type: Number,
      required: true,
      default: 1
    },
    bidIncrement: {
      type: Number,
      required: true,
      default: 1
    },
    maxTeamsPerUser: {
      type: Number,
      default: null // null means unlimited
    },
    allowProxyBids: {
      type: Boolean,
      default: false
    },
    pauseOnDisconnect: {
      type: Boolean,
      default: true
    }
  },
  statistics: {
    totalBids: {
      type: Number,
      default: 0
    },
    averageBidTime: {
      type: Number,
      default: 0
    },
    highestBid: {
      type: Number,
      default: 0
    },
    lowestBid: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    }
  },
  pauseReason: {
    type: String,
    default: null
  },
  pausedAt: {
    type: Date,
    default: null
  },
  resumedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for auction progress
auctionSchema.virtual('progress').get(function() {
  const soldTeams = this.teams.filter(team => team.status === 'sold').length;
  const totalTeams = this.teams.length;
  return totalTeams > 0 ? Math.round((soldTeams / totalTeams) * 100) : 0;
});

// Virtual for remaining teams
auctionSchema.virtual('remainingTeams').get(function() {
  return this.teams.filter(team => team.status === 'available').length;
});

// Virtual for active participants
auctionSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for time remaining in current bid
auctionSchema.virtual('timeRemaining').get(function() {
  if (!this.bidEndTime || this.status !== 'active') return 0;
  const remaining = Math.max(0, Math.floor((this.bidEndTime - new Date()) / 1000));
  return remaining;
});

// Indexes for better performance
auctionSchema.index({ league: 1 });
auctionSchema.index({ status: 1 });
auctionSchema.index({ startTime: 1 });
auctionSchema.index({ 'participants.user': 1 });
auctionSchema.index({ 'bids.team': 1, 'bids.timestamp': -1 });

// Method to generate draft order
auctionSchema.methods.generateDraftOrder = function() {
  const participants = [...this.participants];
  
  // Shuffle participants randomly
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  
  // Set draft order
  this.draftOrder = participants.map((participant, index) => ({
    user: participant.user,
    position: index + 1
  }));
  
  // Generate nomination order using snake draft
  this.generateNominationOrder();
  
  return this;
};

// Method to generate nomination order (snake draft)
auctionSchema.methods.generateNominationOrder = function() {
  const participantCount = this.participants.length;
  const totalTeams = 32;
  const roundsNeeded = Math.ceil(totalTeams / participantCount);
  
  this.nominationOrder = [];
  
  for (let round = 1; round <= roundsNeeded; round++) {
    const isOddRound = round % 2 === 1;
    
    for (let pos = 1; pos <= participantCount; pos++) {
      const actualPosition = isOddRound ? pos : participantCount - pos + 1;
      const user = this.draftOrder.find(d => d.position === actualPosition)?.user;
      
      if (user) {
        this.nominationOrder.push({
          user,
          round,
          position: pos,
          hasNominated: false
        });
      }
    }
  }
  
  return this;
};

// Method to start auction
auctionSchema.methods.start = function() {
  if (this.status !== 'scheduled') {
    throw new Error('Auction cannot be started');
  }
  
  this.status = 'active';
  this.startTime = new Date();
  
  // Set first nominator
  if (this.nominationOrder.length > 0) {
    this.currentNominator = this.nominationOrder[0].user;
  }
  
  return this;
};

// Method to nominate team
auctionSchema.methods.nominateTeam = function(teamId, nominatorId, startingBid) {
  if (this.status !== 'active') {
    throw new Error('Auction is not active');
  }
  
  if (this.currentNominator.toString() !== nominatorId.toString()) {
    throw new Error('Not your turn to nominate');
  }
  
  const team = this.teams.find(t => t.nflTeam.toString() === teamId.toString());
  if (!team || team.status !== 'available') {
    throw new Error('Team is not available for nomination');
  }
  
  // Validate starting bid meets minimum requirement
  if (startingBid < this.settings.minimumBid) {
    throw new Error(`Starting bid must be at least $${this.settings.minimumBid}`);
  }
  
  // Check if nominator has enough budget
  const participant = this.participants.find(p => p.user.toString() === nominatorId.toString());
  if (!participant) {
    throw new Error('Nominator is not a participant in this auction');
  }
  
  if (participant.spent + startingBid > participant.budget) {
    throw new Error('Insufficient budget for starting bid');
  }
  
  // Update team status
  team.status = 'nominated';
  team.nominatedBy = nominatorId;
  team.nominatedAt = new Date();
  
  // Set current auction state
  this.currentTeam = teamId;
  this.currentBid = startingBid;
  this.currentHighBidder = nominatorId;
  this.bidEndTime = new Date(Date.now() + (this.bidTimer * 1000));
  
  // Mark nominator as having nominated
  const nominator = this.nominationOrder.find(n => 
    n.user.toString() === nominatorId.toString() && 
    n.round === this.currentRound && 
    !n.hasNominated
  );
  if (nominator) {
    nominator.hasNominated = true;
  }
  
  // Add initial bid
  this.bids.push({
    team: teamId,
    bidder: nominatorId,
    amount: startingBid,
    timestamp: new Date(),
    isWinning: true
  });
  
  return this;
};

// Method to place bid
auctionSchema.methods.placeBid = function(teamId, bidderId, bidAmount) {
  if (this.status !== 'active') {
    throw new Error('Auction is not active');
  }
  
  if (!this.currentTeam || this.currentTeam.toString() !== teamId.toString()) {
    throw new Error('Team is not currently being auctioned');
  }
  
  if (bidAmount <= this.currentBid) {
    throw new Error('Bid must be higher than current bid');
  }
  
  if (bidAmount < this.currentBid + this.settings.bidIncrement) {
    throw new Error(`Bid must be at least ${this.currentBid + this.settings.bidIncrement}`);
  }
  
  // Check if bidder has enough budget
  const participant = this.participants.find(p => p.user.toString() === bidderId.toString());
  if (!participant) {
    throw new Error('Bidder is not a participant in this auction');
  }
  
  if (participant.spent + bidAmount > participant.budget) {
    throw new Error('Insufficient budget');
  }
  
  // Mark previous winning bid as not winning
  this.bids.forEach(bid => {
    if (bid.team.toString() === teamId.toString()) {
      bid.isWinning = false;
    }
  });
  
  // Add new bid
  this.bids.push({
    team: teamId,
    bidder: bidderId,
    amount: bidAmount,
    timestamp: new Date(),
    isWinning: true
  });
  
  // Update current auction state
  this.currentBid = bidAmount;
  this.currentHighBidder = bidderId;
  this.bidEndTime = new Date(Date.now() + (this.bidTimer * 1000));
  
  // Update statistics
  this.statistics.totalBids += 1;
  this.statistics.highestBid = Math.max(this.statistics.highestBid, bidAmount);
  if (this.statistics.lowestBid === 0) {
    this.statistics.lowestBid = bidAmount;
  } else {
    this.statistics.lowestBid = Math.min(this.statistics.lowestBid, bidAmount);
  }
  
  return this;
};

// Method to complete current team auction
auctionSchema.methods.completeCurrentTeamAuction = function() {
  if (!this.currentTeam || !this.currentHighBidder) {
    throw new Error('No active team auction to complete');
  }
  
  // Update team status
  const team = this.teams.find(t => t.nflTeam.toString() === this.currentTeam.toString());
  if (team) {
    team.status = 'sold';
    team.soldTo = this.currentHighBidder;
    team.finalPrice = this.currentBid;
    team.soldAt = new Date();
  }
  
  // Update participant
  const participant = this.participants.find(p => p.user.toString() === this.currentHighBidder.toString());
  if (participant) {
    participant.spent += this.currentBid;
    participant.teamsOwned.push(this.currentTeam);
  }
  
  // Update statistics
  this.statistics.totalValue += this.currentBid;
  
  // Reset current auction state
  this.currentTeam = null;
  this.currentHighBidder = null;
  this.currentBid = 0;
  this.bidEndTime = null;
  
  // Move to next nominator
  this.moveToNextNominator();
  
  return this;
};

// Method to move to next nominator
auctionSchema.methods.moveToNextNominator = function() {
  this.currentNominationIndex += 1;
  
  if (this.currentNominationIndex >= this.nominationOrder.length) {
    // Check if all teams have been auctioned
    const remainingTeams = this.teams.filter(team => team.status === 'available');
    
    if (remainingTeams.length > 0) {
      // Force nomination of remaining teams - restart the order
      this.currentNominationIndex = 0;
      const nextNomination = this.nominationOrder[this.currentNominationIndex];
      this.currentNominator = nextNomination.user;
      this.currentRound = nextNomination.round;
    } else {
      // All teams auctioned - auction complete
      this.status = 'completed';
      this.endTime = new Date();
      this.currentNominator = null;
    }
  } else {
    // Move to next nominator
    const nextNomination = this.nominationOrder[this.currentNominationIndex];
    this.currentNominator = nextNomination.user;
    this.currentRound = nextNomination.round;
  }
  
  return this;
};

// Method to check if auction can end (all teams must be auctioned)
auctionSchema.methods.canComplete = function() {
  const availableTeams = this.teams.filter(team => team.status === 'available');
  return availableTeams.length === 0;
};

// Method to get available teams for nomination
auctionSchema.methods.getAvailableTeams = function() {
  return this.teams.filter(team => team.status === 'available');
};

// Method to force auto-nomination if player times out (optional enforcement)
auctionSchema.methods.autoNominate = function() {
  const availableTeams = this.getAvailableTeams();
  if (availableTeams.length === 0) {
    throw new Error('No teams available for auto-nomination');
  }
  
  // Pick first available team
  const teamToNominate = availableTeams[0];
  const minimumBid = this.settings.minimumBid;
  
  return this.nominateTeam(teamToNominate.nflTeam, this.currentNominator, minimumBid);
};

// Method to pause auction
auctionSchema.methods.pause = function(reason = null) {
  if (this.status === 'active') {
    this.status = 'paused';
    this.pauseReason = reason;
    this.pausedAt = new Date();
  }
  return this;
};

// Method to resume auction
auctionSchema.methods.resume = function() {
  if (this.status === 'paused') {
    this.status = 'active';
    this.resumedAt = new Date();
    
    // Extend bid timer if there was an active bid
    if (this.bidEndTime && this.pausedAt) {
      const pauseDuration = this.resumedAt - this.pausedAt;
      this.bidEndTime = new Date(this.bidEndTime.getTime() + pauseDuration);
    }
  }
  return this;
};

// Method to get participant budget info
auctionSchema.methods.getParticipantBudget = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) return null;
  
  return {
    total: participant.budget,
    spent: participant.spent,
    remaining: participant.budget - participant.spent,
    teamsOwned: participant.teamsOwned.length
  };
};

module.exports = mongoose.model('Auction', auctionSchema);
