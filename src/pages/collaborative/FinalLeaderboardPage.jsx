import React, { useState, useMemo } from 'react';

function FinalLeaderboardPage({ participants, onExit }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 25;

  // Filter out host and sort participants by score
  const playersOnly = participants.filter(p => !p.isHost);
  
  const sortedParticipants = [...playersOnly]
  .sort((a, b) => (b.score || 0) - (a.score || 0));
  const allHaveZeroPoints = playersOnly.every(p => (p.score || 0) === 0);

  // Filter by search
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return sortedParticipants;
    return sortedParticipants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedParticipants, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParticipants = filteredParticipants.slice(startIndex, startIndex + itemsPerPage);

  // Top 3
  const top3 = sortedParticipants.slice(0, 3);

  // Confetti
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

  const getRankDisplay = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-6 sm:py-12 relative overflow-hidden">
      
      {/* Confetti */}
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

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-3">
            Final Results! 🏆
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-semibold">
            Complete Leaderboard - {playersOnly.length} Players
          </p>
        </div>

        {/* 🥇 TOP 3 PODIUM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="md:order-1 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl sm:rounded-3xl p-6 shadow-xl border-2 border-slate-300 transform md:translate-y-8">
              <div className="text-center">
                <div className="text-5xl mb-3">🥈</div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-4 border-white flex items-center justify-center text-2xl shadow-lg">
                  {top3[1].avatar}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{top3[1].name}</h3>
                <p className="text-3xl font-black text-slate-600">{top3[1].score || 0}</p>
                <p className="text-sm text-gray-600 font-semibold">points</p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="md:order-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl sm:rounded-3xl p-8 shadow-2xl border-4 border-yellow-400 transform scale-105">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🥇</div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-4 border-white flex items-center justify-center text-3xl shadow-2xl">
                  {top3[0].avatar}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">👑 {top3[0].name}</h3>
                <p className="text-5xl font-black text-orange-600">{top3[0].score || 0}</p>
                <p className="text-base text-gray-700 font-bold">points</p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="md:order-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl sm:rounded-3xl p-6 shadow-xl border-2 border-slate-300 transform md:translate-y-8">
              <div className="text-center">
                <div className="text-5xl mb-3">🥉</div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-4 border-white flex items-center justify-center text-2xl shadow-lg">
                  {top3[2].avatar}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{top3[2].name}</h3>
                <p className="text-3xl font-black text-amber-700">{top3[2].score || 0}</p>
                <p className="text-sm text-gray-600 font-semibold">points</p>
              </div>
            </div>
          )}
        </div>

        {/* 🔍 SEARCH & FILTERS */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none font-semibold"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-600">
              Showing {filteredParticipants.length} of {playersOnly.length}
            </div>
          </div>
        </div>

        {/* 📊 FULL LEADERBOARD (Paginated) */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-black">Rank</th>
                  <th className="px-4 py-4 text-left text-sm font-black">Player</th>
                  <th className="px-4 py-4 text-center text-sm font-black">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedParticipants.map((participant, idx) => {
                  const actualRank = startIndex + idx;
                  return (
                    <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-gray-700">
                            {getRankDisplay(actualRank)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-lg shadow">
                            {participant.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{participant.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-2xl font-black text-gray-900">{participant.score || 0}</span>
                      </td>
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <span className="text-lg font-bold text-purple-600">
                          {participant.accuracy || 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📄 PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 font-bold text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {/* Exit Button */}
        <div className="text-center">
          <button
            onClick={onExit}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Back to Home
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default FinalLeaderboardPage;