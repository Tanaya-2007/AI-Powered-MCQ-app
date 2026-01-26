import React, { useState, useEffect } from 'react';

function LiveLeaderboardMini({ participants, maxShow = 5 }) {
  // Filter out host and sort by score (highest first)
  const playersOnly = participants.filter(p => !p.isHost); 
  const sortedParticipants = [...playersOnly]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, maxShow);
    
  const [prevRankings, setPrevRankings] = useState({});
  const [rankChanges, setRankChanges] = useState({});
  
  useEffect(() => {
    const newRankings = {};
    const changes = {};
    
    sortedParticipants.forEach((p, index) => {
      newRankings[p.id] = index;
      
      if (prevRankings[p.id] !== undefined) {
        const change = prevRankings[p.id] - index;
        if (change !== 0) {
          changes[p.id] = change;
        }
      }
    });
    
    setRankChanges(changes);
    setPrevRankings(newRankings);
    
    if (Object.keys(changes).length > 0) {
      setTimeout(() => setRankChanges({}), 2000);
    }
  }, [sortedParticipants.map(p => p.id).join(','), sortedParticipants.map(p => p.score).join(',')]);
 
  const allHaveZeroPoints = playersOnly.every(p => (p.score || 0) === 0);
  const maxScore = Math.max(...playersOnly.map(p => p.score || 0), 1);

  const getRankBadge = (rank) => {
    const badges = {
      0: { label: 'A', emoji: '🥇', color: 'from-yellow-400 to-orange-500', border: 'border-yellow-500', bg: 'bg-green-100' },
      1: { label: 'B', emoji: '🥈', color: 'from-slate-300 to-slate-400', border: 'border-slate-400', bg: 'bg-white' },
      2: { label: 'D', emoji: '🥉', color: 'from-amber-500 to-amber-600', border: 'border-amber-500', bg: 'bg-white' },
    };
    return badges[rank] || { label: 'C', emoji: '#4', color: 'from-gray-300 to-gray-400', border: 'border-gray-300', bg: 'bg-white' };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Live Leaderboard</h3>
            <p className="text-xs text-gray-500 font-semibold">Real-time rankings</p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {sortedParticipants.map((participant, rank) => {
          const badge = getRankBadge(rank);
          const percentage = Math.round(((participant.score || 0) / maxScore) * 100);
          
          return (
            <div
              key={participant.id}
              className={`rounded-xl border-2 ${badge.border} ${badge.bg} p-4 transition-all duration-300 hover:shadow-md`}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Rank Badge with Letter */}
                <div className={`relative w-12 h-12 bg-gradient-to-br ${badge.color} rounded-lg flex items-center justify-center shadow-md flex-shrink-0`}>
                  <span className="text-2xl">{allHaveZeroPoints ? `#${rank + 1}` : badge.emoji}</span>
                  <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center text-white text-xs font-black border-2 border-white`}>
                    {badge.label}
                  </div>
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-xl shadow-md flex-shrink-0">
                    {participant.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-gray-900 truncate">
                      {participant.name}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">1 player</p>
                  </div>
                </div>

                {/* Score with Animation */}
                <div className="text-right flex-shrink-0 relative">
                  {rankChanges[participant.id] && (
                    <div className={`absolute -top-3 -right-2 text-lg animate-bounce ${
                      rankChanges[participant.id] > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {rankChanges[participant.id] > 0 ? '↑' : '↓'}
                    </div>
                  )}
                  <p className={`text-3xl font-black ${
                    rank === 0 ? 'text-green-600' : 'text-gray-900'
                  } transition-all duration-300 ${rankChanges[participant.id] ? 'scale-110' : ''}`}>
                    {percentage}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    rank === 0 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : rank === 1
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-r from-purple-400 to-purple-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More */}
      {playersOnly.length > maxShow && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm font-semibold text-gray-500">
            +{playersOnly.length - maxShow} more players
          </p>
        </div>
      )}
    </div>
  );
}

// Demo
export default function App() {
  const demoParticipants = [
    { id: '1', name: 'class', avatar: '🏆', score: 25, isHost: false },
    { id: '2', name: 'Class', avatar: '🎯', score: 50, isHost: false },
    { id: '3', name: 'create', avatar: '🎨', score: 25, isHost: false },
    { id: '4', name: 'new', avatar: '✨', score: 0, isHost: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <LiveLeaderboardMini participants={demoParticipants} maxShow={5} />
    </div>
  );
}