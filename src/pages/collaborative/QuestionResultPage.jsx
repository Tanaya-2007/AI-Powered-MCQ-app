import React, { useEffect, useMemo } from 'react';
import LiveLeaderboardMini from '../../components/collab/LiveLeaderboardMini';

function QuestionResultPage({ 
  question,
  selectedAnswer,
  participants,
  currentUserId, 
  onNextQuestion,
  isLastQuestion,
  isHost, 
  autoRedirectTime = 5 
}) {
  const isCorrect = selectedAnswer === question.correctAnswer;
  const correctOption = question.options[question.correctAnswer];

  const playersOnly = participants.filter(p => !p.isHost);
  const sortedPlayers = [...playersOnly].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const currentUserRank = sortedPlayers.findIndex(p => p.id === currentUserId) + 1;

  // Calculate voting statistics for each option
  const optionStats = useMemo(() => {
    return question.options.map((option, index) => {
      const voters = playersOnly.filter(p => p.selectedOption === index);
      const percentage = playersOnly.length > 0 
        ? Math.round((voters.length / playersOnly.length) * 100) 
        : 0;
      
      return {
        letter: String.fromCharCode(65 + index),
        text: option,
        voters: voters,
        count: voters.length,
        percentage: percentage,
        isCorrect: index === question.correctAnswer
      };
    });
  }, [question, playersOnly]);

  // Calculate accuracy
  const correctCount = playersOnly.filter(p => p.selectedOption === question.correctAnswer).length;
  const accuracy = playersOnly.length > 0 ? Math.round((correctCount / playersOnly.length) * 100) : 0;

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

  // Auto redirect (only for non-hosts)
  useEffect(() => {
    if (!isHost) {
      const timer = setTimeout(() => {
        onNextQuestion();
      }, autoRedirectTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoRedirectTime, onNextQuestion, isHost]);

  const getOptionColor = (option) => {
    if (option.isCorrect) {
      return {
        bg: 'from-green-50 to-emerald-50',
        border: 'border-green-300',
        icon: 'bg-green-600',
        bar: 'from-green-500 to-emerald-600',
        text: 'text-green-700'
      };
    }
    return {
      bg: 'from-gray-50 to-slate-50',
      border: 'border-gray-200',
      icon: 'bg-gray-400',
      bar: 'from-gray-400 to-slate-500',
      text: 'text-gray-600'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-8 sm:py-12 relative overflow-hidden">
      
      {/* Confetti for correct answers */}
      {isCorrect && (
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
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header with Stats */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4 animate-scale-in">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Answer Revealed!</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Correct</p>
              <p className="text-2xl font-black text-gray-900">{correctCount}/{playersOnly.length}</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Accuracy</p>
              <p className="text-2xl font-black text-gray-900">{accuracy}%</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 font-semibold">Players</p>
              <p className="text-2xl font-black text-gray-900">{playersOnly.length}</p>
            </div>
          </div>

          {!isHost && (
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-md">
              <p className="text-sm font-bold">Your Rank: #{currentUserRank > 0 ? currentUserRank : '—'}</p>
            </div>
          )}
        </div>

        {/* Voting Results & Leaderboard - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-slide-up">
          
          {/* Left: Voting Distribution - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg h-full">
              <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Voting Distribution
              </h2>

              <div className="space-y-4">
                {optionStats.map((option) => {
                  const colors = getOptionColor(option);
                  
                  return (
                    <div
                      key={option.letter}
                      className={`bg-gradient-to-r ${colors.bg} rounded-xl border-2 ${colors.border} p-4 transition-all duration-300`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        {/* Option Letter */}
                        <div className={`relative w-14 h-14 ${colors.icon} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                          <span className="text-2xl font-black text-white">
                            {option.letter}
                          </span>
                          {option.isCorrect && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-black text-gray-900 mb-1 truncate">
                            {option.text}
                          </h4>
                          <div className="flex items-center gap-2">
                            {option.count > 0 ? (
                              <>
                                <div className="flex -space-x-2">
                                  {option.voters.slice(0, 3).map((voter, idx) => (
                                    <div 
                                      key={idx}
                                      className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-white flex items-center justify-center text-xs shadow"
                                    >
                                      {voter.avatar}
                                    </div>
                                  ))}
                                  {option.count > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700">
                                      +{option.count - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm text-gray-700 font-semibold">
                                  {option.count} player{option.count > 1 ? 's' : ''}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500 font-semibold">No votes</span>
                            )}
                          </div>
                        </div>

                        {/* Percentage */}
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-4xl font-black ${option.isCorrect ? 'text-green-600' : 'text-gray-900'}`}>
                            {option.percentage}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {option.percentage > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-700 bg-gradient-to-r ${colors.bar}`}
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Live Leaderboard - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 shadow-lg mb-4">
              <p className="text-xs text-gray-600 text-center">
                <span className="font-black">🏆 Rankings:</span> Based on <span className="text-green-600 font-bold">correct</span> + <span className="text-blue-600 font-bold">speed</span>
              </p>
            </div>
            <LiveLeaderboardMini participants={participants} maxShow={5} />
          </div>
        </div>

        {/* Controls */}
        <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {isHost ? (
            <button
              onClick={onNextQuestion}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isLastQuestion ? '🏆 View Final Results' : '➡️ Next Question'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {isLastQuestion ? 'Loading results...' : `Next in ${autoRedirectTime}s`}
              </span>
            </div>
          )}
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

        @keyframes scale-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default QuestionResultPage;