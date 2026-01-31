import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PersonalRankCard() {
  const navigate = useNavigate();
  const [animateRank, setAnimateRank] = useState(false);

  // Mock data - Replace with actual player data from quiz session
  const playerData = {
    name: "Alex",
    avatar: "🚀",
    currentRank: 3,
    previousRank: 5,
    score: 67, // Total score so far
    isCorrect: true,
    answerTime: 8, // Seconds taken to answer
    timeLimit: 30, // Time limit for this question (can be 30, 60, 120, etc.)
    totalPlayers: 15,
    questionNumber: 3,
    totalQuestions: 10
  };

  // DYNAMIC 10-POINT SCORING SYSTEM
  // Works for ANY time limit (30s, 60s, 120s, etc.)
  const calculatePoints = (isCorrect, answerTime, timeLimit) => {
    if (!isCorrect) return 0; // Wrong answer = 0 points
    
    // Calculate time percentage (faster = higher percentage)
    const timeRemaining = timeLimit - answerTime;
    const timePercentage = timeRemaining / timeLimit;
    
    // Convert to points (1-10 scale)
    // Minimum 1 point if correct (even if answered at last second)
    const points = Math.max(1, Math.ceil(timePercentage * 10));
    
    return points;
  };

  const pointsEarned = calculatePoints(
    playerData.isCorrect, 
    playerData.answerTime, 
    playerData.timeLimit
  );

  // Calculate speed rating
  const getSpeedRating = (answerTime, timeLimit) => {
    const percentage = (answerTime / timeLimit) * 100;
    
    if (percentage < 20) return { emoji: '⚡', text: 'Lightning Fast!', color: 'text-yellow-600' };
    if (percentage < 40) return { emoji: '🔥', text: 'Super Fast!', color: 'text-orange-600' };
    if (percentage < 60) return { emoji: '✅', text: 'Good Speed!', color: 'text-green-600' };
    if (percentage < 80) return { emoji: '👍', text: 'Nice Try!', color: 'text-blue-600' };
    return { emoji: '⏱️', text: 'Close Call!', color: 'text-purple-600' };
  };

  const speedRating = getSpeedRating(playerData.answerTime, playerData.timeLimit);

  useEffect(() => {
    // Trigger rank animation
    setTimeout(() => setAnimateRank(true), 300);
  }, []);

  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-indigo-500 to-purple-600';
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '⭐';
  };

  const rankChange = playerData.currentRank - playerData.previousRank;

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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          
          {/* Result Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-gray-100 p-8 text-center">
            
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-sm font-bold text-gray-500">
                  Question {playerData.questionNumber} of {playerData.totalQuestions}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(playerData.questionNumber / playerData.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Answer Feedback */}
            {playerData.isCorrect ? (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl animate-scale-in">
                <div className="text-6xl mb-3">✅</div>
                <h3 className="text-3xl font-black text-green-900 mb-2">Correct!</h3>
                
                {/* Points Display with Animation */}
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg mb-3">
                  <span className="text-3xl font-black">+{pointsEarned}</span>
                  <span className="text-lg font-bold">points</span>
                </div>
                
                {/* Speed Rating */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{speedRating.emoji}</span>
                  <span className={`text-sm font-bold ${speedRating.color}`}>
                    {speedRating.text}
                  </span>
                </div>
                
                {/* Time Info */}
                <p className="text-xs text-green-700 font-semibold mt-2">
                  Answered in {playerData.answerTime}s / {playerData.timeLimit}s
                </p>
              </div>
            ) : (
              <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl animate-scale-in">
                <div className="text-6xl mb-3">❌</div>
                <h3 className="text-3xl font-black text-red-900 mb-2">Wrong!</h3>
                
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg mb-3">
                  <span className="text-3xl font-black">+0</span>
                  <span className="text-lg font-bold">points</span>
                </div>
                
                <p className="text-sm text-red-700 font-semibold">
                  Better luck next time! 💪
                </p>
              </div>
            )}

            {/* Player Avatar & Name */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="text-6xl">{playerData.avatar}</div>
              </div>
              <h2 className="text-2xl font-black text-gray-900">{playerData.name}</h2>
            </div>

            {/* Current Rank - BIG DISPLAY */}
            <div className={`mb-6 p-8 bg-gradient-to-br ${getRankColor(playerData.currentRank)} rounded-3xl shadow-2xl ${animateRank ? 'animate-rank-reveal' : 'opacity-0 scale-90'}`}>
              <div className="text-7xl mb-3">{getRankEmoji(playerData.currentRank)}</div>
              <div className="text-white">
                <p className="text-lg font-bold mb-2 opacity-90">Your Rank</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-7xl font-black">
                    {playerData.currentRank}
                  </span>
                  <span className="text-4xl font-black">
                    {getRankSuffix(playerData.currentRank)}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-3 opacity-90">
                  out of {playerData.totalPlayers} players
                </p>
              </div>
            </div>

            {/* Rank Change Indicator */}
            {rankChange !== 0 && (
              <div className="mb-6 animate-slide-up">
                {rankChange < 0 ? (
                  <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-black text-lg">
                      Up {Math.abs(rankChange)} {Math.abs(rankChange) === 1 ? 'place' : 'places'}!
                    </span>
                    <span className="text-2xl">🎉</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300 rounded-xl">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800 font-black text-lg">
                      Down {rankChange} {rankChange === 1 ? 'place' : 'places'}
                    </span>
                    <span className="text-2xl">😔</span>
                  </div>
                )}
              </div>
            )}

            {/* Score Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-200">
                <p className="text-xs font-bold text-gray-600 mb-1">Total Score</p>
                <p className="text-3xl font-black text-indigo-600">{playerData.score}</p>
                <p className="text-xs text-gray-500 mt-1">out of {playerData.questionNumber * 10}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-xs font-bold text-gray-600 mb-1">This Question</p>
                <p className="text-3xl font-black text-purple-600">+{pointsEarned}</p>
                <p className="text-xs text-gray-500 mt-1">out of 10</p>
              </div>
            </div>

            {/* Scoring Explanation */}
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <span className="text-xl">💡</span>
                <div className="text-left flex-1">
                  <p className="text-xs font-bold text-amber-900 mb-1">Scoring System</p>
                  <p className="text-xs text-amber-700">
                    Faster answers = more points! Each question is worth 1-10 points based on your speed.
                  </p>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              {playerData.currentRank === 1 ? (
                <p className="text-blue-900 font-bold text-sm">
                  🔥 You're in the lead! Keep it up!
                </p>
              ) : playerData.currentRank <= 3 ? (
                <p className="text-blue-900 font-bold text-sm">
                  💪 So close to the top! You've got this!
                </p>
              ) : rankChange < 0 ? (
                <p className="text-blue-900 font-bold text-sm">
                  🚀 Great job! You're climbing up!
                </p>
              ) : (
                <p className="text-blue-900 font-bold text-sm">
                  💡 Stay focused! You can still win this!
                </p>
              )}
            </div>

            {/* Next Question Button */}
            <button
              onClick={() => {
                // Navigate to next question or final results
                if (playerData.questionNumber < playerData.totalQuestions) {
                  navigate('/collab/quiz-session');
                } else {
                  navigate('/collab/final-results');
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {playerData.questionNumber < playerData.totalQuestions ? (
                <>
                  Next Question
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                <>
                  View Final Results
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes moveDots {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
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

        @keyframes rank-reveal {
          0% {
            transform: scale(0.5) rotate(-5deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) rotate(2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-rank-reveal {
          animation: rank-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out 0.3s both;
        }
      `}</style>
    </div>
  );
}

export default PersonalRankCard;