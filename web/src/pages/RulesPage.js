import React from 'react';
import { motion } from 'framer-motion';

const RulesPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const rulesSections = [
    {
      id: 1,
      title: "Forming a Group",
      icon: "👥",
      rules: [
        "A group is created to play the game.",
        "Groups require at least 2 players to start.",
        "Groups use a special invitation code to join."
      ]
    },
    {
      id: 2,
      title: "Starting the Auction",
      icon: "🏈",
      rules: [
        "Once the group is ready, the auction for all 32 NFL teams begins.",
        "A random order of players is generated.",
        "The order follows a snake pattern (first to last, then last to first, and so on)."
      ]
    },
    {
      id: 3,
      title: "Nominations",
      icon: "📋",
      rules: [
        "When it's your turn, you must nominate a team for auction. Skipping is not allowed.",
        "A team cannot be left out—all 32 teams must be auctioned.",
        "You must start the nomination with a minimum bid (e.g., $10).",
        "If no one else bids, the team is yours at your nominated amount.",
        "If others bid, the highest bidder wins the team."
      ]
    },
    {
      id: 4,
      title: "Prize Pool",
      icon: "💰",
      rules: [
        "The total of all bids from the auction forms the reward pool.",
        "Winnings are distributed based on team performance in the NFL season and playoffs."
      ]
    },
    {
      id: 5,
      title: "Game Payouts",
      icon: "🏆",
      description: "Each NFL team's performance earns rewards for its owner. The payout percentages can be customized before the season starts.",
      rules: [
        {
          category: "Regular Season Wins",
          details: "Each win earns ~70% of the pool (shared across all wins)."
        },
        {
          category: "Playoffs",
          details: [
            "Wild Card win: ~2.5% of the pool",
            "Divisional Round win: ~2.5% of the pool",
            "Conference Championship win: ~2.5% of the pool",
            "Super Bowl appearance: ~10% of the pool",
            "Super Bowl Champion: Remaining share"
          ]
        },
        {
          category: "Optional Split",
          details: "Example: ~10% may be divided equally among all top 4 teams."
        }
      ]
    },
    {
      id: 6,
      title: "Weekly Updates",
      icon: "📊",
      rules: [
        "Team wins are updated weekly based on official NFL results.",
        "Winnings are recalculated and displayed each week."
      ]
    },
    {
      id: 7,
      title: "Final Winnings",
      icon: "🎉",
      rules: [
        "At the end of the NFL season, all payouts are finalized.",
        "The total amount a player wins is based on the teams they purchased and how far those teams advanced."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Own Your Team
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-indigo-600 mb-6">
            Fantasy Game Rules
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Welcome to Own Your Team, where you auction for NFL teams and earn rewards based on their real-world performance throughout the season and playoffs.
          </p>
        </motion.div>

        <div className="space-y-8">
          {rulesSections.map((section, index) => (
            <motion.div
              key={section.id}
              className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="text-3xl md:text-4xl">{section.icon}</div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {section.id}. {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-gray-600 mb-4 text-lg">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {section.rules.map((rule, ruleIndex) => {
                  if (typeof rule === 'string') {
                    return (
                      <div key={ruleIndex} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700 text-base leading-relaxed">{rule}</p>
                      </div>
                    );
                  } else {
                    return (
                      <div key={ruleIndex} className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
                        <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                          {rule.category}
                        </h4>
                        {Array.isArray(rule.details) ? (
                          <ul className="space-y-1">
                            {rule.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-start space-x-2">
                                <span className="text-indigo-500 font-bold">•</span>
                                <span className="text-gray-700">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-700">{rule.details}</p>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Game Flow Summary */}
        <motion.div 
          className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-xl p-8 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            🎯 Game Flow Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xl font-semibold mb-3">Pre-Season</h4>
              <div className="space-y-2 text-sm md:text-base">
                <p>• Create or join a league with invitation code</p>
                <p>• Wait for minimum 2 players</p>
                <p>• Participate in snake draft auction</p>
                <p>• Purchase NFL teams with your budget</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-semibold mb-3">During Season</h4>
              <div className="space-y-2 text-sm md:text-base">
                <p>• Teams earn points for wins</p>
                <p>• Weekly updates and standings</p>
                <p>• Playoff bonuses for advancement</p>
                <p>• Final payouts at season end</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Own Your Team?
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Join or create a league and start building your NFL empire!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105">
                Create League
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105">
                Join League
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RulesPage;
