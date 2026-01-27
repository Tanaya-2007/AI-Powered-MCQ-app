import React, { useState, useEffect } from 'react';

function LiveLeaderboardMini({ participants, maxShow = 5 }) {
  
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
 
  const maxScore = Math.max(...playersOnly.map(p => p.score || 0), 1);

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-yellow-400 to-orange-500';
    if (rank === 1) return 'from-slate-400 to-slate-500';
    if (rank === 2) return 'from-amber-600 to-amber-700';
    return 'from-gray-300 to-gray-400';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-5 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">Live Rankings</h3>
          <p className="text-xs text-gray-500 mt-0.5">Real-time updates</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2.5">
        {sortedParticipants.map((participant, rank) => {
          const percentage = Math.round(((participant.score || 0) / maxScore) * 100);
          
          return (
            <div key={participant.id} className="group">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200">
                {/* Rank Badge */}
                <div className={`relative w-10 h-10 bg-gradient-to-br ${getRankColor(rank)} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <span className="text-lg font-black text-white">{rank + 1}</span>
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                    {participant.avatar}
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{participant.name}</p>
                </div>

                {/* Score with rank change indicator */}
                <div className="text-right flex-shrink-0 relative">
                  {rankChanges[participant.id] && (
                    <div className={`absolute -top-2 -right-2 text-sm animate-bounce ${
                      rankChanges[participant.id] > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {rankChanges[participant.id] > 0 ? '↑' : '↓'}
                    </div>
                  )}
                  <p className={`text-xl font-black ${rank === 0 ? 'text-green-600' : 'text-gray-900'} ${rankChanges[participant.id] ? 'scale-110' : ''} transition-all`}>
                    {participant.score || 0}
                  </p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-1.5 ml-13 mr-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    rank === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-purple-500 to-indigo-600'
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
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <p className="text-xs font-semibold text-gray-400">
            +{playersOnly.length - maxShow} more
          </p>
        </div>
      )}
    </div>
  );
}

export default LiveLeaderboardMini;