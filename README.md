# NFL Own Your Team - Fantasy Football Application

A comprehensive fantasy football application where users auction and own entire NFL teams rather than individual players. Built with Node.js, React, and React Native for web, Android, and iOS platforms.

## 🏈 Overview

NFL Own Your Team revolutionizes fantasy football by allowing participants to bid on and own entire NFL teams. Users create private leagues, participate in team auctions, and earn money based on their teams' real-world performance throughout the NFL season.

## ✨ Key Features

- **Team-Based Fantasy**: Own entire NFL teams instead of individual players
- **Auction System**: Snake draft pattern with real-time bidding
- **Private Leagues**: Create leagues with unique invitation codes
- **Customizable Payouts**: Flexible payout structures for wins and playoffs
- **Real-Time Updates**: Live auction bidding and NFL data integration
- **Multi-Platform**: Web, Android, and iOS applications

## 🛠 Technical Stack

### Backend
- Node.js/Express API server
- MongoDB with Mongoose ODM
- Socket.io for real-time features
- JWT authentication with bcrypt
- Automated cron jobs for NFL data

### Frontend
- React with Redux Toolkit
- Tailwind CSS for styling
- Socket.io client for real-time updates
- React Hook Form for form handling

### Mobile
- React Native for iOS and Android
- Shared Redux store with web
- Platform-specific navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/agoginen/NflOwnYourTeam.git
cd NflOwnYourTeam
```

2. Install dependencies:
```bash
npm run install-all
```

3. Setup environment:
```bash
cd backend
cp env.example .env
# Edit .env with your configuration
```

4. Seed the database:
```bash
cd backend
npm run seed
```

5. Start development servers:
```bash
npm run dev
```

### Default Login
After seeding:
- Admin: admin@nflownyourteam.com / Admin123!
- User: john@example.com / Password123!

## 📊 Architecture

### Project Structure
```
NflOwnYourTeam/
├── backend/          # Node.js API server
├── web/             # React web application  
├── mobile/          # React Native apps
└── docs/            # Documentation
```

### Database Models
- **User**: Authentication and profile data
- **League**: League configuration and members
- **NFLTeam**: Team data and statistics
- **Auction**: Real-time auction management
- **Bid**: Bidding history and records

## 🎯 Game Rules

### League Creation
1. Create league with unique invite code
2. Set auction budget and timer settings
3. Configure payout percentages
4. Invite 2-32 participants

### Auction Process
1. Random snake draft order
2. Participants nominate teams in order
3. Real-time competitive bidding
4. Timer-based team assignment
5. Budget tracking throughout

### Payout System
- Regular season wins: Configurable %
- Playoff wins: Escalating bonuses
- Super Bowl: Appearance + victory bonuses
- Automated weekly calculations

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Leagues
- `GET /api/leagues` - User's leagues
- `POST /api/leagues` - Create league
- `POST /api/leagues/join` - Join with code

### Auctions
- `POST /api/auctions` - Create auction
- `POST /api/auctions/:id/nominate` - Nominate team
- `POST /api/auctions/:id/bid` - Place bid

### NFL Data
- `GET /api/nfl/teams` - All NFL teams
- `GET /api/nfl/standings` - Current standings
- `GET /api/nfl/playoffs` - Playoff teams

## 🔐 Security Features

- JWT token authentication
- bcrypt password hashing
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Role-based access control

## 📱 Mobile Apps

React Native applications for iOS and Android with:
- Native navigation patterns
- Push notifications for auctions
- Offline data caching
- Platform-specific UI adaptations

## 🚀 Deployment

### Development
```bash
npm run dev  # Starts backend + web
```

### Production
- Backend: Docker + PM2
- Frontend: Vercel/Netlify
- Database: MongoDB Atlas
- CDN: CloudFlare

## 📈 Current Status

✅ **Completed:**
- Complete backend API with authentication
- Database models and relationships
- Real-time auction system with Socket.io
- NFL data integration and automation
- Payout calculation system
- Redux store and state management
- Core React components and layouts

🚧 **In Progress:**
- React web application pages
- Mobile React Native applications
- Admin dashboard interface

📋 **Planned:**
- Comprehensive testing suite
- Mobile app store deployment
- Advanced analytics dashboard
- Social features and leagues

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- Create an issue for bug reports
- Join discussions for questions
- Check documentation in `/docs`

---

**Built for NFL fans who want to own their teams! 🏈**