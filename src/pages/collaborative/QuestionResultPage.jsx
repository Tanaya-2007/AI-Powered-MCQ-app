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

      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Result Card */}
        <div className="text-center mb-8 animate-fade-in">
          {!isHost && (
            <div className="inline-block mb-6 px-6 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm">
              <p className="text-xs font-medium text-gray-500 mb-1">Your Rank</p>
              <p className="text-3xl font-black text-gray-900">
                {currentUserRank > 0 ? `#${currentUserRank}` : '—'}
              </p>
            </div>
          )}
          
          {isCorrect ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg animate-scale-in">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-green-600">Correct! 🎉</h1>
              <p className="text-base text-gray-600">Great job! You got it right.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full shadow-lg animate-scale-in">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-red-600">Incorrect ❌</h1>
              <p className="text-base text-gray-600">Keep trying, you'll get it!</p>
            </div>
          )}
        </div>

        {/* Correct Answer */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-green-200 p-6 mb-8 shadow-sm animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm flex-shrink-0">
              {String.fromCharCode(65 + question.correctAnswer)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-700 mb-1">Correct Answer</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{correctOption}</p>
            </div>
            <div className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex-shrink-0">
              ✓ ANSWER
            </div>
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <LiveLeaderboardMini participants={participants} maxShow={5} />
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