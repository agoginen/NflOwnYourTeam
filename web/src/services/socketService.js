import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// Store and action imports will be dynamic to avoid circular dependencies
let store = null;
let actions = null;

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize store and actions dynamically
  initializeStore(storeInstance) {
    if (!store) {
      store = storeInstance;
      // Dynamically import actions to avoid circular dependencies
      import('../store/slices/auctionSlice').then(module => {
        if (!actions) {
          actions = {
            updateCurrentTeam: module.updateCurrentTeam,
            addBid: module.addBid,
            completeTeamSale: module.completeTeamSale,
            updateAuctionStatus: module.updateAuctionStatus,
            updateNextNominator: module.updateNextNominator,
          };
        }
      });
      import('../store/slices/uiSlice').then(module => {
        if (!actions) actions = {};
        actions.addNotification = module.addNotification;
      });
    }
  }

  // Helper to safely dispatch actions
  dispatch(action) {
    if (store && action) {
      store.dispatch(action);
    }
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    // For development, use localhost:5000, for production use current origin
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000' 
      : window.location.origin;
    
    console.log('🔌 Connecting to socket:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 30000, // Increased timeout
      forceNew: false, // Don't force new connection
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: {
        userId: userId
      }
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      
      // If it's a timeout error, try to reconnect with polling only
      if (error.message.includes('timeout')) {
        console.log('🔄 Retrying with polling transport only...');
        setTimeout(() => {
          if (this.socket && !this.isConnected) {
            this.socket.io.opts.transports = ['polling'];
          }
        }, 1000);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    // League events
    this.socket.on('league-updated', (data) => {
      if (actions?.actions?.addNotification) {
        this.dispatch(actions.actions?.addNotification({
          type: 'info',
          title: 'League Updated',
          message: data.message || 'League settings have been updated',
        }));
      }
    });

    this.socket.on('member-joined', (data) => {
      this.dispatch(actions?.addNotification({
        type: 'info',
        title: 'New Member',
        message: `${data.member.username} joined the league`,
      }));
    });

    this.socket.on('member-left', (data) => {
      this.dispatch(actions?.addNotification({
        type: 'info',
        title: 'Member Left',
        message: `${data.member.username} left the league`,
      }));
    });

    // Auction events
    this.socket.on('auction-created', (data) => {
      toast.success('Auction has been scheduled!');
      this.dispatch(actions?.addNotification({
        type: 'success',
        title: 'Auction Created',
        message: data.message,
      }));
    });

    this.socket.on('auction-started', (data) => {
      toast.success('Auction has started!');
      this.dispatch(actions?.updateAuctionStatus('active'));
      this.dispatch(actions?.addNotification({
        type: 'success',
        title: 'Auction Started',
        message: data.message,
      }));
    });

    this.socket.on('team-nominated', (data) => {
      const { team, nominator, startingBid, bidEndTime } = data;
      
      this.dispatch(actions?.updateCurrentTeam({
        team: team,
        bid: startingBid,
        bidder: nominator,
        bidEndTime: bidEndTime
      }));

      toast.success(`${team.name} nominated by ${nominator.username}`);
      
      this.dispatch(actions?.addNotification({
        type: 'info',
        title: 'Team Nominated',
        message: `${team.name} nominated for $${startingBid}`,
      }));
    });

    this.socket.on('bid-placed', (data) => {
      const { bidder, bidAmount, bidEndTime } = data;
      
      this.dispatch(actions?.addBid({
        bidder: bidder,
        amount: bidAmount,
        timestamp: new Date(),
        team: data.teamId
      }));

      // Update current auction state
      this.dispatch(actions?.updateCurrentTeam({
        team: null, // Keep current team
        bid: bidAmount,
        bidder: bidder,
        bidEndTime: bidEndTime
      }));

      // Show toast for bid updates
      const state = store.getState();
      const currentUser = state.auth.user;
      
      if (bidder._id !== currentUser?.id) {
        toast(`${bidder.username} bid $${bidAmount}`, {
          icon: '💰',
          duration: 2000,
        });
      }
    });

    this.socket.on('team-sold', (data) => {
      const { team, winner, finalPrice, isAuctionComplete, nextNominator } = data;
      
      this.dispatch(actions?.completeTeamSale({
        team: team,
        winner: winner,
        finalPrice: finalPrice
      }));

      if (nextNominator) {
        this.dispatch(actions?.updateNextNominator(nextNominator));
      }

      toast.success(`${team.name} sold to ${winner.username} for $${finalPrice}`);
      
      this.dispatch(actions?.addNotification({
        type: 'success',
        title: 'Team Sold',
        message: `${team.name} sold for $${finalPrice}`,
      }));

      if (isAuctionComplete) {
        this.dispatch(actions?.updateAuctionStatus('completed'));
        toast.success('🎉 Auction Complete!', { duration: 5000 });
      }
    });

    this.socket.on('auction-paused', (data) => {
      this.dispatch(actions?.updateAuctionStatus('paused'));
      toast.info('Auction paused');
      
      this.dispatch(actions?.addNotification({
        type: 'warning',
        title: 'Auction Paused',
        message: data.reason || 'Auction has been paused',
      }));
    });

    this.socket.on('auction-resumed', (data) => {
      this.dispatch(actions?.updateAuctionStatus('active'));
      toast.success('Auction resumed');
      
      this.dispatch(actions?.addNotification({
        type: 'success',
        title: 'Auction Resumed',
        message: 'Auction has been resumed',
      }));
    });

    this.socket.on('auction-completed', (data) => {
      this.dispatch(actions?.updateAuctionStatus('completed'));
      toast.success('🎉 Auction Complete!', { duration: 5000 });
      
      this.dispatch(actions?.addNotification({
        type: 'success',
        title: 'Auction Complete',
        message: data.message,
      }));
    });

    // NFL data events
    this.socket.on('nfl-data-updated', (data) => {
      this.dispatch(actions?.addNotification({
        type: 'info',
        title: 'NFL Data Updated',
        message: `Week ${data.week} results have been updated`,
      }));
    });

    this.socket.on('payouts-calculated', (data) => {
      toast.success('Weekly payouts have been calculated!');
      
      this.dispatch(actions?.addNotification({
        type: 'success',
        title: 'Payouts Calculated',
        message: `Week ${data.week} payouts are now available`,
      }));
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Please refresh the page.');
    });

    // Custom notification events
    this.socket.on('notification', (notification) => {
      this.dispatch(actions?.addNotification(notification));
      
      if (notification.showToast !== false) {
        switch (notification.type) {
          case 'success':
            toast.success(notification.message);
            break;
          case 'error':
            toast.error(notification.message);
            break;
          case 'warning':
            toast(notification.message, { icon: '⚠️' });
            break;
          default:
            toast(notification.message);
        }
      }
    });
  }

  // Join league room
  joinLeague(leagueId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-league', leagueId);
    }
  }

  // Leave league room
  leaveLeague(leagueId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-league', leagueId);
    }
  }

  // Join auction room
  joinAuction(auctionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-auction', auctionId);
    }
  }

  // Leave auction room
  leaveAuction(auctionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-auction', auctionId);
    }
  }

  // Send custom event
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.socket && this.isConnected;
  }
}

// Create singleton instance
export const socketService = new SocketService();

export default socketService;
