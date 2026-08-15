import React, { useState, useMemo } from 'react';

function MidQuizLeaderboardPage({ 
  participants, 
  isHost, 
  isLastQuestion, 
  onNext, 
  questionIndex,
  totalQuestions
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const playersOnly = participants.filter(p => !p.isHost);
  
  const sortedParticipants = [...playersOnly]
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }
      return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
    });

  const maxScore = Math.max(...playersOnly.map(p => p.score || 0), 1);

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-yellow-400 to-orange-500';
    if (rank === 1) return 'from-slate-400 to-slate-500';
    if (rank === 2) return 'from-amber-600 to-amber-700';
    return 'from-gray-300 to-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Decorative background grid and shapes */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.15) 2px, transparent 2px)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-3 shadow-lg animate-bounce">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            Current Standings 🏆
          </h1>
          <p className="text-xs text-indigo-200 font-bold">
            Question {questionIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Leaderboard List */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Rankings</h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {playersOnly.length} Players
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {sortedParticipants.map((participant, rank) => {
              const percentage = Math.round(((participant.score || 0) / maxScore) * 100);
              
              return (
                <div key={participant.id} className="group">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200">
                    {/* Rank Badge */}
                    <div className={`relative w-9 h-9 bg-gradient-to-br ${getRankColor(rank)} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <span className="text-base font-black text-white">{rank + 1}</span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-base shadow-sm flex-shrink-0">
                        {participant.avatar}
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{participant.name}</p>
                    </div>

                    {/* Score and Time */}
                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-base font-black text-gray-950">
                          {participant.score || 0}
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold">pts</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-full mt-0.5 whitespace-nowrap">
                        ⏱️ {participant.totalTimeTaken !== undefined ? `${participant.totalTimeTaken}s` : '0s'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-1 ml-12 mr-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        rank === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-purple-500 to-indigo-650'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls / Loading State */}
        <div className="text-center">
          {isHost ? (
            <button
              onClick={onNext}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-650 text-white text-base font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-102 active:scale-98"
            >
              {isLastQuestion ? '🏆 View Final Results' : '➡️ Next Question'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 px-6 py-3.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-md w-full justify-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
              <span className="text-sm font-bold text-white">
                {isLastQuestion 
                  ? 'Waiting for host to end quiz...' 
                  : 'Waiting for host to start next question...'
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MidQuizLeaderboardPage;
