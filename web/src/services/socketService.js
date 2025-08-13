import { io } from 'socket.io-client';
import { store } from '../store';
import { 
  updateCurrentTeam, 
  addBid, 
  completeTeamSale, 
  updateAuctionStatus,
  updateNextNominator 
} from '../store/slices/auctionSlice';
import { addNotification } from '../store/slices/uiSlice';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
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
    });

    // League events
    this.socket.on('league-updated', (data) => {
      store.dispatch(addNotification({
        type: 'info',
        title: 'League Updated',
        message: data.message || 'League settings have been updated',
      }));
    });

    this.socket.on('member-joined', (data) => {
      store.dispatch(addNotification({
        type: 'info',
        title: 'New Member',
        message: `${data.member.username} joined the league`,
      }));
    });

    this.socket.on('member-left', (data) => {
      store.dispatch(addNotification({
        type: 'info',
        title: 'Member Left',
        message: `${data.member.username} left the league`,
      }));
    });

    // Auction events
    this.socket.on('auction-created', (data) => {
      toast.success('Auction has been scheduled!');
      store.dispatch(addNotification({
        type: 'success',
        title: 'Auction Created',
        message: data.message,
      }));
    });

    this.socket.on('auction-started', (data) => {
      toast.success('Auction has started!');
      store.dispatch(updateAuctionStatus('active'));
      store.dispatch(addNotification({
        type: 'success',
        title: 'Auction Started',
        message: data.message,
      }));
    });

    this.socket.on('team-nominated', (data) => {
      const { team, nominator, startingBid, bidEndTime } = data;
      
      store.dispatch(updateCurrentTeam({
        team: team,
        bid: startingBid,
        bidder: nominator,
        bidEndTime: bidEndTime
      }));

      toast.success(`${team.name} nominated by ${nominator.username}`);
      
      store.dispatch(addNotification({
        type: 'info',
        title: 'Team Nominated',
        message: `${team.name} nominated for $${startingBid}`,
      }));
    });

    this.socket.on('bid-placed', (data) => {
      const { bidder, bidAmount, bidEndTime } = data;
      
      store.dispatch(addBid({
        bidder: bidder,
        amount: bidAmount,
        timestamp: new Date(),
        team: data.teamId
      }));

      // Update current auction state
      store.dispatch(updateCurrentTeam({
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
      
      store.dispatch(completeTeamSale({
        team: team,
        winner: winner,
        finalPrice: finalPrice
      }));

      if (nextNominator) {
        store.dispatch(updateNextNominator(nextNominator));
      }

      toast.success(`${team.name} sold to ${winner.username} for $${finalPrice}`);
      
      store.dispatch(addNotification({
        type: 'success',
        title: 'Team Sold',
        message: `${team.name} sold for $${finalPrice}`,
      }));

      if (isAuctionComplete) {
        store.dispatch(updateAuctionStatus('completed'));
        toast.success('🎉 Auction Complete!', { duration: 5000 });
      }
    });

    this.socket.on('auction-paused', (data) => {
      store.dispatch(updateAuctionStatus('paused'));
      toast.info('Auction paused');
      
      store.dispatch(addNotification({
        type: 'warning',
        title: 'Auction Paused',
        message: data.reason || 'Auction has been paused',
      }));
    });

    this.socket.on('auction-resumed', (data) => {
      store.dispatch(updateAuctionStatus('active'));
      toast.success('Auction resumed');
      
      store.dispatch(addNotification({
        type: 'success',
        title: 'Auction Resumed',
        message: 'Auction has been resumed',
      }));
    });

    this.socket.on('auction-completed', (data) => {
      store.dispatch(updateAuctionStatus('completed'));
      toast.success('🎉 Auction Complete!', { duration: 5000 });
      
      store.dispatch(addNotification({
        type: 'success',
        title: 'Auction Complete',
        message: data.message,
      }));
    });

    // NFL data events
    this.socket.on('nfl-data-updated', (data) => {
      store.dispatch(addNotification({
        type: 'info',
        title: 'NFL Data Updated',
        message: `Week ${data.week} results have been updated`,
      }));
    });

    this.socket.on('payouts-calculated', (data) => {
      toast.success('Weekly payouts have been calculated!');
      
      store.dispatch(addNotification({
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
      store.dispatch(addNotification(notification));
      
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
