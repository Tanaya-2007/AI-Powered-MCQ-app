import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'

function FinalLeaderboardPage({ participants, onExit }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const playersOnly = participants.filter(p => !p.isHost);
  
  const sortedParticipants = [...playersOnly]
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // Top 3
  const top3 = sortedParticipants.slice(0, 3);


  const restOfPlayers = useMemo(() => {
    const afterTop3 = sortedParticipants.slice(3);
    if (!searchQuery.trim()) return afterTop3;
    
    return afterTop3.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedParticipants, searchQuery]);

  const maxScore = Math.max(...playersOnly.map(p => p.score || 0), 1);

  
  const confettiDots = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 6,
      color: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 6)]
    }));
  }, []);

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-yellow-400 to-orange-500';
    if (rank === 1) return 'from-slate-400 to-slate-500';
    if (rank === 2) return 'from-amber-600 to-amber-700';
    return 'from-gray-300 to-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-8 relative overflow-hidden">
      
    
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confettiDots.map((dot) => (
          <div
            key={dot.id}
            className="absolute"
            style={{
              left: `${dot.left}%`,
              top: '-20px',
              animation: `confettiFall ${dot.duration}s ease-out ${dot.delay}s infinite`
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                backgroundColor: dot.color
              }}
            />
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center justify-center gap-2">
            Final Results! 🏆
          </h1>
          <p className="text-sm text-gray-600 font-semibold">
            {playersOnly.length} Players Competed
          </p>
        </div>

        {/* Top 3 */}
        {top3.length > 0 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-3">
              
              {/* 2nd Place - Left */}
              {top3[1] && (
                <div className="flex flex-col items-center w-24">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg mb-2 relative">
                    <span className="text-2xl font-black text-white">2</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 border-4 border-white flex items-center justify-center text-2xl shadow-md mb-2">
                    {top3[1].avatar}
                  </div>
                  <h3 className="text-sm font-black text-gray-900 mb-1 text-center">
                    {top3[1].name}
                  </h3>
                  <p className="text-2xl font-black text-gray-900">{top3[1].score || 0}</p>
                  <p className="text-xs text-gray-600 font-semibold">points</p>
                </div>
              )}

              {/* 1st Place - Center  */}
              {top3[0] && (
                <div className="flex flex-col items-center w-32 -mt-6">
                  <div className="mb-1">
                    <span className="text-3xl">👑</span>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-200">
                      <span className="text-3xl font-black text-white">1</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      WINNER
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 border-4 border-white flex items-center justify-center text-3xl shadow-lg mb-2 mt-3">
                    {top3[0].avatar}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-1 text-center">
                    {top3[0].name}
                  </h3>
                  <p className="text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {top3[0].score || 0}
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">points</p>
                </div>
              )}

              {/* 3rd Place - Right */}
              {top3[2] && (
                <div className="flex flex-col items-center w-24">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg mb-2 relative">
                    <span className="text-2xl font-black text-white">3</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 border-4 border-white flex items-center justify-center text-2xl shadow-md mb-2">
                    {top3[2].avatar}
                  </div>
                  <h3 className="text-sm font-black text-gray-900 mb-1 text-center">
                    {top3[2].name}
                  </h3>
                  <p className="text-2xl font-black text-gray-900">{top3[2].score || 0}</p>
                  <p className="text-xs text-gray-600 font-semibold">points</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rest Players */}
        {sortedParticipants.length > 3 && (
          <div>
            {/* Search Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4 mb-5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 text-sm font-medium transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-3">
                Showing {restOfPlayers.length} of {sortedParticipants.length - 3} players
              </p>
            </div>

          
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-5">
              <div className="space-y-2.5">
                {restOfPlayers.map((participant) => {
                  const actualRank = sortedParticipants.indexOf(participant);
                  const percentage = Math.round(((participant.score || 0) / maxScore) * 100);
                  
                  return (
                    <div key={participant.id} className="group">
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200">
                        {/* Rank Badge */}
                        <div className={`relative w-10 h-10 bg-gradient-to-br ${getRankColor(actualRank)} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                          <span className="text-lg font-black text-white">{actualRank + 1}</span>
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                            {participant.avatar}
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate">{participant.name}</p>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black text-gray-900 transition-all">
                            {participant.score || 0}
                          </p>
                          <p className="text-xs text-gray-500">pts</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-1.5 ml-13 mr-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 to-indigo-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {restOfPlayers.length === 0 && searchQuery && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500 font-semibold">No players found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
        <button
        onClick={() => {
          if (onExit) {
            onExit();
          }
          navigate('/'); 
        }}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        Back to Home
      </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(1080deg);
            opacity: 0.3;
          }
        }
        .animate-confetti-fall {
          animation: confettiFall ease-out infinite;
        }
      `}</style>
    </div>
  );
}


export default FinalLeaderboardPage;