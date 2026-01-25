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
            changes[p.id] = change; // positive = rank up, negative = rank down
          }
        }
      });
      
      setRankChanges(changes);
      setPrevRankings(newRankings);
      
      // Clear animations after 2 seconds
      if (Object.keys(changes).length > 0) {
        setTimeout(() => setRankChanges({}), 2000);
      }
    }, [sortedParticipants.map(p => p.id).join(','), sortedParticipants.map(p => p.score).join(',')]);
 
  const allHaveZeroPoints = playersOnly.every(p => (p.score || 0) === 0);

  const getRankMedal = (rank) => {  
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-yellow-400 to-orange-500';
    if (rank === 1) return 'from-slate-400 to-slate-500';
    if (rank === 2) return 'from-amber-600 to-amber-700';
    return 'from-gray-300 to-gray-400';
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-gray-200 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900">Live Leaderboard</h3>
            <p className="text-xs text-gray-500 font-semibold">Top {maxShow}</p>
          </div>
        </div>
        
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 rounded-lg">
          <span className="text-sm sm:text-base font-black text-purple-700">
            {participants.filter(p => !p.isHost).length} Players
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2 sm:space-y-3">
        {sortedParticipants.map((participant, rank) => (
          <div
            key={participant.id}
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-300 ${
              rank === 0 
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {/* Rank Badge */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${getRankColor(rank)} rounded-lg flex items-center justify-center font-black text-base sm:text-lg text-white shadow-md flex-shrink-0`}>
              {allHaveZeroPoints ? `#${rank + 1}` : getRankMedal(rank)}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-lg sm:text-xl shadow-lg flex-shrink-0">
              {participant.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm sm:text-base font-bold truncate ${
                rank === 0 ? 'text-orange-900' : 'text-gray-900'
              }`}>
                {participant.name}
              </p>
            </div>

            {/* Score */}
          <div className="text-right flex-shrink-0 relative">
            {rankChanges[participant.id] && (
              <div className={`absolute -top-2 -right-2 animate-bounce-slow ${
                rankChanges[participant.id] > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {rankChanges[participant.id] > 0 ? '↑' : '↓'}
              </div>
            )}
            <p className={`text-xl sm:text-2xl font-black transition-all duration-500 ${
              rank === 0 ? 'text-orange-600' : 'text-gray-700'
            } ${rankChanges[participant.id] ? 'scale-110' : ''}`}>
              {participant.score || 0}
            </p>
            <p className="text-xs text-gray-500 font-semibold">points</p>
          </div>
          </div>
        ))}
      </div>

      {/* Show More Link */}
      {participants.filter(p => !p.isHost).length > maxShow && (
        <div className="mt-4 text-center">
          <p className="text-sm font-semibold text-gray-500">
            +{participants.filter(p => !p.isHost).length - maxShow} more players
          </p>
        </div>
      )}
    </div>
  );
}

export default LiveLeaderboardMini;