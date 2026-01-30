import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AttemptQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // States
  const [quizCode, setQuizCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinedLobby, setJoinedLobby] = useState(false);
  const [lobbyInfo, setLobbyInfo] = useState(null);

  // Avatar options - More variety!
  const avatars = [
    '😊', '😎', '🤩', '😇', '🥳', '🤓', '🧐', '😺', '🦊', '🐯', 
    '🦁', '🐻', '🐼', '🐨', '🐸', '🦄', '🦋', '🐝', '🦖', '🦕',
    '🚀', '⭐', '🌟', '💫', '✨', '🔥', '💎', '👑', '🏆', '🎯',
    '🎨', '🎭', '🎪', '🎸', '🎮', '🎲', '🎳', '⚽', '🏀', '🎾',
    '💡', '🌈', '🌺', '🌸', '🌼', '🌻', '🍀', '🍕', '🍔', '🍦',
    '🎂', '🍩', '🧁', '🍿', '☕', '🧃', '🎈', '🎁', '🎊', '🎉'
  ];

  // Auto-fill code from URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setQuizCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Auto-select random avatar on mount
  useEffect(() => {
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setSelectedAvatar(randomAvatar);
  }, []);

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setQuizCode(value);
    setError('');
  };

  const handleShuffleAvatar = () => {
    const otherAvatars = avatars.filter(a => a !== selectedAvatar);
    const randomAvatar = otherAvatars[Math.floor(Math.random() * otherAvatars.length)];
    setSelectedAvatar(randomAvatar);
  };

  const handleJoinQuiz = async () => {
    // Validation
    if (!quizCode || quizCode.length < 6) {
      setError('Please enter a valid quiz code');
      return;
    }

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      // Simulate different scenarios
      const scenario = Math.random();
      
      if (scenario < 0.8) {
        // Success - Join lobby
        setJoinedLobby(true);
        setLobbyInfo({
          quizTitle: 'JavaScript Fundamentals',
          playersCount: 5,
          status: 'waiting'
        });
      } else if (scenario < 0.85) {
        setError('❌ Invalid quiz code. Please check and try again.');
      } else if (scenario < 0.9) {
        setError('⏳ Quiz has not started yet. Please wait for the host.');
      } else if (scenario < 0.95) {
        setError('🔒 This quiz has already ended.');
      } else {
        setError('🧑‍🤝‍🧑 This quiz lobby is full. Cannot join.');
      }
      
      setIsJoining(false);
    }, 1500);
  };

  const handleStartQuiz = () => {
    // Navigate to quiz session (will be created later)
    navigate('/collab/quiz-session', {
      state: {
        quizCode,
        playerName,
        avatar: selectedAvatar,
        isHost: false
      }
    });
  };

  // Waiting for Host Screen
  if (joinedLobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated Background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 2px, transparent 2px)`,
            backgroundSize: '50px 50px',
            animation: 'moveDots 20s linear infinite'
          }}
        ></div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            
            {/* Waiting Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-100 p-8 text-center">
              
              {/* Animated Icon */}
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                  <div className="text-5xl">{selectedAvatar}</div>
                </div>
                <div className="absolute -top-2 -right-2 left-auto right-0 mx-auto w-32">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                Welcome, {playerName}! 👋
              </h1>
              <p className="text-gray-600 mb-6">You've successfully joined the quiz</p>

              {/* Quiz Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{lobbyInfo.quizTitle}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Quiz Code</p>
                    <p className="text-lg font-black text-indigo-600">{quizCode}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Players</p>
                    <p className="text-lg font-black text-purple-600">{lobbyInfo.playersCount}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="relative flex">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <p className="text-base font-black text-yellow-900">Waiting for host to start...</p>
                </div>
                <p className="text-sm text-yellow-700">The quiz will begin shortly</p>
              </div>

              {/* Leave Button */}
              <button
                onClick={() => {
                  setJoinedLobby(false);
                  setLobbyInfo(null);
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Leave Quiz
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes moveDots {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `}</style>
      </div>
    );
  }

  // Main Join Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      
      {/* Animated Background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 2px, transparent 2px)`,
          backgroundSize: '50px 50px',
          animation: 'moveDots 20s linear infinite'
        }}
      ></div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-30 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:rotate-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              QuizMaster
            </span>
          </div>

          <button 
            onClick={() => navigate('/collaborative')}
            className="group flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white border-2 border-gray-200 rounded-lg transition-all duration-300"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-semibold">Back</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-20 min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-full border border-indigo-300/30 shadow-lg mb-6">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Join Quiz
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
              Ready to
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Join the Quiz?
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Enter the quiz code and get ready to compete!
            </p>
          </div>

          {/* Join Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-100 p-6 sm:p-8">
            
            {/* Quiz Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Quiz Code
              </label>
              <input
                type="text"
                value={quizCode}
                onChange={handleCodeChange}
                placeholder="Enter 6-8 character code"
                autoFocus
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-black tracking-wider uppercase transition-all"
                maxLength={8}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {quizCode.length}/8 characters
              </p>
            </div>

            {/* Player Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your nickname"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-semibold transition-all"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-2">
                This will appear on the leaderboard
              </p>
            </div>

            {/* Avatar Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                </svg>
                Choose Your Avatar
              </label>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center justify-center">
                  <div className="text-6xl">{selectedAvatar}</div>
                </div>
                <button
                  onClick={handleShuffleAvatar}
                  className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
              </div>
              
              {/* Avatar Grid - Scrollable */}
              <div className="mt-3 max-h-32 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-8 gap-2 pr-2">
                  {avatars.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                        selectedAvatar === avatar
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg scale-110 ring-2 ring-indigo-300'
                          : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Scroll to see more avatars • {avatars.length} total
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl animate-shake">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-bold text-red-900">{error}</p>
                </div>
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoinQuiz}
              disabled={isJoining || quizCode.length < 6 || !playerName.trim()}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining Quiz...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Join Quiz
                </>
              )}
            </button>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">💡 How to Join</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Get the quiz code from your host</li>
                    <li>• Enter your name (shown on leaderboard)</li>
                    <li>• Pick a fun avatar</li>
                    <li>• Click "Join Quiz" and wait for the game to start!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes moveDots {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default AttemptQuiz;