// 📄 NEW FILE: src/pages/collaborative/QuestionResultPage.jsx

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
}) 

{
  const isCorrect = selectedAnswer === question.correctAnswer;
  const correctOption = question.options[question.correctAnswer];

  // Filter out host from leaderboard
  const playersOnly = participants.filter(p => !p.isHost);
  
  // Find current user's rank
  const sortedPlayers = [...playersOnly].sort((a, b) => (b.score || 0) - (a.score || 0));
  const currentUserRank = sortedPlayers.findIndex(p => p.id === currentUserId) + 1;

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

  // Auto redirect (only for non-hosts, host controls manually)
  useEffect(() => {
    if (!isHost) {
      const timer = setTimeout(() => {
        onNextQuestion();
      }, autoRedirectTime * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoRedirectTime, onNextQuestion, isHost]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 px-4 py-6 sm:py-12 relative overflow-hidden">
      
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

      <div className="max-w-4xl mx-auto">
        
        {/* Result Status Card */}
        <div className="text-center mb-6 sm:mb-8 animate-scale-in">
          {!isHost && ( // ⚡ Only show rank for non-host players
            <div className="inline-block mb-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg">
              <p className="text-sm font-bold">Your Current Rank</p>
              <p className="text-4xl font-black">
                {currentUserRank > 0 ? `#${currentUserRank}` : 'N/A'}
              </p>
            </div>
          )}
          
          {isCorrect ? (
            <>
              {/* Correct Answer */}
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 sm:mb-6 shadow-2xl">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-green-600 mb-3">
                Correct! 🎉
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 font-semibold">
                You got it right! Great job!
              </p>
            </>
          ) : (
            <>
              {/* Wrong Answer */}
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-full mb-4 sm:mb-6 shadow-2xl">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-red-600 mb-3">
                Incorrect ❌
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 font-semibold">
                Don't worry, keep trying!
              </p>
            </>
          )}
        </div>

        {/* Correct Answer Display */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-green-300 p-6 sm:p-8 mb-6 sm:mb-8 animate-slide-up">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 rounded-xl flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-lg">
              {String.fromCharCode(65 + question.correctAnswer)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-700 mb-1">Correct Answer</p>
              <p className="text-lg sm:text-xl font-black text-gray-900">{correctOption}</p>
            </div>
            <div className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-full">
              ✓ ANSWER
            </div>
          </div>
        </div>

        {/* Live Leaderboard Mini */}
        <div className="mb-6 sm:mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <LiveLeaderboardMini participants={participants} maxShow={5} />
        </div>

        {/* Auto Redirect Info or Host Controls */}
        <div className="text-center">
          {isHost ? (
            // ⚡ HOST: Manual controls
            <div className="space-y-4">
              <button
                onClick={onNextQuestion}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {isLastQuestion ? '🏆 View Final Results' : '➡️ Next Question'}
              </button>
            </div>
          ) : (
            // ⚡ PLAYERS: Auto redirect message
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl border-2 border-purple-200 shadow-lg">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
              <span className="text-sm sm:text-base font-bold text-gray-700">
                {isLastQuestion ? 'Loading final results...' : `Next question in ${autoRedirectTime}s`}
              </span>
            </div>
          )}
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

        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

export default QuestionResultPage;