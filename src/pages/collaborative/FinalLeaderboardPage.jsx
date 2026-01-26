import React, { useState, useMemo } from 'react';

function FinalLeaderboardPage({ participants, onExit }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out host and sort participants by score
  const playersOnly = participants.filter(p => !p.isHost);
  
  const sortedParticipants = [...playersOnly]
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // Filter by search
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return sortedParticipants;
    return sortedParticipants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedParticipants, searchQuery]);

  // Top 3
  const top3 = sortedParticipants.slice(0, 3);
  const restOfPlayers = filteredParticipants.slice(3);

  // Confetti dots
  const confettiDots = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 6)]
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-8 relative overflow-hidden">
      
      {/* Falling Confetti */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confettiDots.map((dot) => (
          <div
            key={dot.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${dot.left}%`,
              top: '-20px',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
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

        {/* PODIUM - Top 3 */}
        {top3.length > 0 && (
          <div className="mb-8">
            <div className="flex items-end justify-center gap-3">
              
              {/* 2nd Place - Left */}
              {top3[1] && (
                <div className="flex flex-col items-center w-24">
                  {/* Medal Badge */}
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg mb-2 relative">
                    <span className="text-2xl font-black text-white">2</span>
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 border-4 border-white flex items-center justify-center text-2xl shadow-md mb-2">
                    {top3[1].avatar}
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-black text-gray-900 mb-1 text-center">
                    {top3[1].name}
                  </h3>

                  {/* Score */}
                  <p className="text-2xl font-black text-gray-900">{top3[1].score || 0}</p>
                  <p className="text-xs text-gray-600 font-semibold">points</p>
                </div>
              )}

              {/* 1st Place - Center (WINNER) */}
              {top3[0] && (
                <div className="flex flex-col items-center w-32 -mt-6">
                  {/* Crown */}
                  <div className="mb-1">
                    <span className="text-3xl">👑</span>
                  </div>

                  {/* Medal Badge with WINNER tag */}
                  <div className="relative mb-2">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-200">
                      <span className="text-3xl font-black text-white">1</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      WINNER
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 border-4 border-white flex items-center justify-center text-3xl shadow-lg mb-2 mt-3">
                    {top3[0].avatar}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-black text-gray-900 mb-1 text-center">
                    {top3[0].name}
                  </h3>

                  {/* Score */}
                  <p className="text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {top3[0].score || 0}
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">points</p>
                </div>
              )}

              {/* 3rd Place - Right */}
              {top3[2] && (
                <div className="flex flex-col items-center w-24">
                  {/* Medal Badge */}
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg mb-2 relative">
                    <span className="text-2xl font-black text-white">3</span>
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 border-4 border-white flex items-center justify-center text-2xl shadow-md mb-2">
                    {top3[2].avatar}
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-black text-gray-900 mb-1 text-center">
                    {top3[2].name}
                  </h3>

                  {/* Score */}
                  <p className="text-2xl font-black text-gray-900">{top3[2].score || 0}</p>
                  <p className="text-xs text-gray-600 font-semibold">points</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REST OF PLAYERS */}
        {sortedParticipants.length > 3 && (
          <div>
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-2">
                Showing {restOfPlayers.length} of {sortedParticipants.length - 3} players
              </p>
            </div>

            {/* Players List */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 divide-y divide-gray-200">
              {restOfPlayers.map((participant, idx) => {
                const actualRank = sortedParticipants.indexOf(participant) + 1;
                
                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="text-lg font-black text-gray-700 w-8">
                      #{actualRank}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                      {participant.avatar}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">
                        {participant.name}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900">
                        {participant.score || 0}
                      </p>
                      <p className="text-xs text-gray-500 font-semibold">points</p>
                    </div>
                  </div>
                );
              })}

              {restOfPlayers.length === 0 && searchQuery && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500 font-semibold">No players found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={onExit}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Back to Home
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.7;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear infinite;
        }
      `}</style>
    </div>
  );
}

// Demo
export default function App() {
  const demoParticipants = [
    { id: '1', name: 'Alice', avatar: '😊', score: 950, isHost: false },
    { id: '2', name: 'Bob', avatar: '😎', score: 820, isHost: false },
    { id: '3', name: 'Charlie', avatar: '🚀', score: 750, isHost: false },
    { id: '4', name: 'Diana', avatar: '⭐', score: 680, isHost: false },
    { id: '5', name: 'Eve', avatar: '🎯', score: 590, isHost: false },
    { id: '6', name: 'Frank', avatar: '🔥', score: 520, isHost: false },
    { id: '7', name: 'Grace', avatar: '💎', score: 450, isHost: false },
    { id: '8', name: 'Henry', avatar: '🌟', score: 380, isHost: false },
  ];

  return <FinalLeaderboardPage participants={demoParticipants} onExit={() => alert('Exit')} />;
}