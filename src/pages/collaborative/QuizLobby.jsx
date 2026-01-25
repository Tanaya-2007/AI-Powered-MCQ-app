import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function QuizLobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizCode, difficulty, numQuestions, timePerQuestion } = location.state || {};

  // States
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', avatar: '👑', isHost: true, joinedAt: Date.now() }
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showActivityToast, setShowActivityToast] = useState(null);

  const demoParticipants = [
    { name: 'Alice', avatar: '👩' },
    { name: 'Bob', avatar: '👨' },
    { name: 'Charlie', avatar: '🧑' },
    { name: 'Diana', avatar: '👧' },
    { name: 'Eve', avatar: '👩‍💼' },
    { name: 'Frank', avatar: '👨‍💼' },
    { name: 'Grace', avatar: '👩‍🎓' },
  ];

  // Simulate participants joining AND leaving
  useEffect(() => {
    const joinInterval = setInterval(() => {
      if (participants.length < 8) {
        const newParticipant = demoParticipants[participants.length - 1];
        const participant = {
          id: participants.length + 1,
          name: newParticipant.name,
          avatar: newParticipant.avatar,
          isHost: false,
          joinedAt: Date.now()
        };
        
        setParticipants(prev => [...prev, participant]);
        
        // Show join toast
        setShowActivityToast({ type: 'join', participant });
        setTimeout(() => setShowActivityToast(null), 3000);
        
        // Add to recent activity feed (show only 4)
        setRecentActivity(prev => [
          { type: 'join', participant, timestamp: Date.now() },
          ...prev
        ].slice(0, 4));
      }
    }, 3000);

    // Simulate someone leaving occasionally
    const leaveInterval = setInterval(() => {
      if (participants.length > 3) {
        const randomIndex = Math.floor(Math.random() * (participants.length - 1)) + 1; // Don't remove host
        const leavingParticipant = participants[randomIndex];
        
        setParticipants(prev => prev.filter((_, i) => i !== randomIndex));
        
        // Show leave toast
        setShowActivityToast({ type: 'leave', participant: leavingParticipant });
        setTimeout(() => setShowActivityToast(null), 3000);
        
        // Add to recent activity feed
        setRecentActivity(prev => [
          { type: 'leave', participant: leavingParticipant, timestamp: Date.now() },
          ...prev
        ].slice(0, 4));
      }
    }, 8000);

    return () => {
      clearInterval(joinInterval);
      clearInterval(leaveInterval);
    };
  }, [participants.length]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quizCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/collab/join?code=${quizCode}`;
    if (navigator.share) {
      navigator.share({ title: 'Join Quiz', text: `Join my quiz with code: ${quizCode}`, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartQuiz = () => {
    console.log('🔥 START QUIZ CLICKED!');
    console.log('Participants:', participants);
    console.log('Participants length:', participants.length);
    
    // if (participants.length < 2) {
    //   console.log('❌ Not enough participants!');
    //   alert('⚠️ Wait for at least one participant to join!');
    //   return;
    // }
    
    console.log('✅ Navigating to quiz session...');
    console.log('State data:', { quizCode, difficulty, numQuestions, timePerQuestion, participants });
    
    navigate('/collab/quiz-session', { 
      state: { quizCode, difficulty, numQuestions, timePerQuestion, participants } 
    });
    
    console.log('✅ Navigate called!');
  };

  const getDifficultyColor = () => {
    switch(difficulty) {
      case 'easy': return 'from-green-500 to-emerald-600';
      case 'medium': return 'from-yellow-500 to-orange-600';
      case 'hard': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden animate-page-enter">
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

      {/* Activity Toast Notification - JOIN or LEAVE */}
      {showActivityToast && (
        <div className="fixed top-24 right-6 z-50 animate-slide-in-right">
          {showActivityToast.type === 'join' ? (
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-200 px-6 py-4 flex items-center gap-3 min-w-[280px]">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-bounce-once">
                {showActivityToast.participant.avatar}
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">🔥 {showActivityToast.participant.name} joined!</p>
                <p className="text-xs text-gray-500">Ready to compete</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-orange-200 px-6 py-4 flex items-center gap-3 min-w-[280px]">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                {showActivityToast.participant.avatar}
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">👋 {showActivityToast.participant.name} left</p>
                <p className="text-xs text-gray-500">Disconnected</p>
              </div>
            </div>
          )}
        </div>
      )}

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
            onClick={() => navigate('/collab/create-quiz')}
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
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Energy Text */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-full border border-indigo-300/30 shadow-lg mb-6">
            <div className="relative flex">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {participants.length === 1 ? 'Waiting for players...' : 'Players are gathering ⚡'}
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">
            Quiz Lobby
          </h1>
          <p className="text-lg text-gray-600">
            {participants.length === 1 ? 'Share the code to let others join' : 'The quiz is about to begin...'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SECTION - Quiz Code & Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quiz Code Card */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 text-center">
              <h3 className="text-sm font-bold text-gray-500 mb-3">QUIZ CODE</h3>
              
              <div className="relative mb-6">
                <div className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wider mb-4">
                  {quizCode}
                </div>
                
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCopyCode}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Code
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareLink}
                  className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Link
                </button>
              </div>
            </div>

            {/* Quiz Settings Card */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Quiz Settings
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Difficulty</span>
                  <span className={`px-3 py-1 bg-gradient-to-r ${getDifficultyColor()} text-white text-xs font-bold rounded-full capitalize`}>
                    {difficulty}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Questions</span>
                  <span className="text-sm text-gray-900 font-bold">{numQuestions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Time/Question</span>
                  <span className="text-sm text-gray-900 font-bold">{timePerQuestion}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION - Participants */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
              {/* Header with Avatar Stack */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Participants</h3>
                      
                      {/* Avatar Stack with Crown Tooltip */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-3">
                          {participants.slice(0, 5).map((p, i) => (
                            <div 
                              key={p.id}
                              className="relative group w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg border-2 border-indigo-500 shadow-lg transform hover:scale-110 transition-transform cursor-pointer"
                              style={{ zIndex: 5 - i }}
                            >
                              {p.avatar}
                              {/* Tooltip for host crown */}
                              {p.isHost && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                                  Host
                                </div>
                              )}
                            </div>
                          ))}
                          {participants.length > 5 && (
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black text-indigo-600 border-2 border-indigo-500 shadow-lg">
                              +{participants.length - 5}
                            </div>
                          )}
                        </div>
                       
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-black text-white">{participants.length}</div>
                    <div className="text-white/80 text-xs font-semibold">PLAYERS</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {participants.length === 1 ? (
                  /* Empty State */
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Waiting for Players...</h3>
                    <p className="text-gray-600 mb-6">Share the quiz code to let others join the battle</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full">
                      <div className="relative flex">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping absolute"></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">Listening for joiners...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Recent Activity Live Feed - ONLY 4-5 items */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        LIVE ACTIVITY FEED
                      </h4>
                      <div className="space-y-2">
                        {recentActivity.slice(0, 3).map((activity, index) => (
                          <div 
                            key={`${activity.participant.id}-${activity.timestamp}`}
                            className={`rounded-xl px-4 py-3 border-2 animate-slide-in-right flex items-center gap-3 ${
                              activity.type === 'join' 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                                : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg ${
                              activity.type === 'join'
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                : 'bg-gradient-to-br from-orange-500 to-red-600'
                            }`}>
                              {activity.participant.avatar}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-900">
                                {activity.participant.name} {activity.type === 'join' ? 'joined 🔥' : 'left 👋'}
                              </p>
                              <p className="text-xs text-gray-500">Just now</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === 'join' ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              <div className={`w-3 h-3 rounded-full ${
                                activity.type === 'join' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                              }`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All Participants Count */}
                    {participants.length > 2 && (
                      <div className="bg-gray-50 rounded-xl p-4 text-center border-2 border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-black text-gray-900 text-lg">{participants.length - 1}</span> more players ready to compete
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Start Quiz Button */}
              {participants.length > 1 && (
                <div className="px-6 pb-6">
                  <button
                    onClick={handleStartQuiz}
                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-black rounded-2xl hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-3">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Start Quiz Now
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                        {participants.length} Players
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes moveDots {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes slide-in-right {
          0% {
            transform: translateX(100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }

        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default QuizLobby;