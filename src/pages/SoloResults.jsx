import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function SoloResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { results, quizData, answers } = location.state || {};
  const [showReview, setShowReview] = useState(false);
  const [pageTransition, setPageTransition] = useState('fade-in');


  const confettiDots = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 6,
      color: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#14B8A6', '#F97316', '#EF4444', '#A855F7'][Math.floor(Math.random() * 10)]
    }));
  }, []);

  if (!results) {
    navigate('/solo-mode');
    return null;
  }

  const getPerformanceData = () => {
    const acc = parseFloat(results.accuracy);
    
    if (acc === 0) {
      return {
        icon: '😢',
        iconBg: 'from-gray-400 to-gray-500',
        title: 'Quiz Complete',
        message: 'No correct answers. Don\'t worry, practice makes perfect!',
        emoji: '',
        showConfetti: false
      };
    } else if (acc < 40) {
      return {
        icon: '📚',
        iconBg: 'from-orange-400 to-red-500',
        title: 'Keep Learning!',
        message: 'You need more practice. Review the material and try again!',
        emoji: '💪',
        showConfetti: false
      };
    } else if (acc < 60) {
      return {
        icon: '📖',
        iconBg: 'from-yellow-400 to-orange-500',
        title: 'Good Try!',
        message: 'You\'re getting there! Keep studying and you\'ll improve!',
        emoji: '👍',
        showConfetti: false
      };
    } else if (acc < 80) {
      return {
        icon: '✓',
        iconBg: 'from-blue-400 to-indigo-500',
        title: 'Well Done!',
        message: 'Good performance! A bit more practice and you\'ll ace it!',
        emoji: '🎯',
        showConfetti: false
      };
    } else if (acc < 95) {
      return {
        icon: '⭐',
        iconBg: 'from-green-500 to-emerald-600',
        title: 'Excellent Work!',
        message: 'Outstanding performance! You really know your stuff!',
        emoji: '🎉',
        showConfetti: true
      };
    } else {
      return {
        icon: '🏆',
        iconBg: 'from-yellow-500 to-amber-600',
        title: 'Perfect Score!',
        message: 'Absolutely incredible! You\'re a master at this!',
        emoji: '🔥',
        showConfetti: true
      };
    }
  };

  const performance = getPerformanceData();

  const smoothTransition = (callback) => {
    setPageTransition('fade-out');
    setTimeout(() => {
      callback();
      setPageTransition('fade-in');
    }, 300);
  };

  // REVIEW MODE
  if (showReview) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 py-12 px-4 ${pageTransition === 'fade-in' ? 'animate-page-enter' : 'animate-page-exit'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Review Answers</h2>
              <button
                onClick={() => smoothTransition(() => setShowReview(false))}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base font-bold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Back to Results
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {quizData.questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.correctAnswer;
              const isSkipped = userAnswer === null;

              return (
                <div key={q.id} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-gray-500">Question {index + 1}</span>
                        {isSkipped && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">SKIPPED</span>
                        )}
                        {!isSkipped && isCorrect && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded">CORRECT</span>
                        )}
                        {!isSkipped && !isCorrect && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">WRONG</span>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900">{q.question}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {q.options.map((option, optIndex) => {
                      const isUserAnswer = userAnswer === optIndex;
                      const isCorrectAnswer = q.correctAnswer === optIndex;

                      return (
                        <div
                          key={optIndex}
                          className={`p-4 rounded-xl border-2 ${
                            isCorrectAnswer
                              ? 'bg-green-50 border-green-500'
                              : isUserAnswer
                              ? 'bg-red-50 border-red-500'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              isCorrectAnswer
                                ? 'bg-green-500 text-white'
                                : isUserAnswer
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className={`font-semibold ${
                              isCorrectAnswer ? 'text-green-900' : isUserAnswer ? 'text-red-900' : 'text-gray-700'
                            }`}>
                              {option}
                            </span>
                            {isCorrectAnswer && (
                              <svg className="w-5 h-5 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-bold text-indigo-900 mb-1">Explanation</p>
                        <p className="text-sm text-indigo-700">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          @keyframes page-enter {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes page-exit {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
          .animate-page-enter {
            animation: page-enter 0.3s ease-out;
          }
          .animate-page-exit {
            animation: page-exit 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // RESULTS PAGE
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12 ${pageTransition === 'fade-in' ? 'animate-page-enter' : 'animate-page-exit'}`}>
      {performance.showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiDots.map((dot) => (
            <div
              key={dot.id}
              className="absolute animate-elegant-fall"
              style={{
                left: `${dot.left}%`,
                top: '-20px',
                animationDelay: `${dot.delay}s`,
                animationDuration: `${dot.duration}s`
              }}
            >
              <div
                className="rounded-full shadow-lg"
                style={{
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  backgroundColor: dot.color,
                  opacity: 0.9
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${performance.iconBg} rounded-full flex items-center justify-center shadow-xl`}>
            <span className="text-5xl">{performance.icon}</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-2">{performance.title}</h2>
          <p className="text-xl text-gray-600">
            {performance.message} {performance.emoji}
          </p>
        </div>

        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <svg className="transform -rotate-90 w-32 h-32 sm:w-40 sm:h-40">
              <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="10" fill="none" className="sm:hidden" />
              <circle cx="80" cy="80" r="70" stroke="#E5E7EB" strokeWidth="12" fill="none" className="hidden sm:block" />
              <circle 
                cx="64" 
                cy="64" 
                r="56" 
                stroke="url(#gradient)" 
                strokeWidth="10" 
                fill="none"
                strokeDasharray={`${(results.accuracy / 100) * 352} 352`}
                className="transition-all duration-1000 sm:hidden"
              />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                stroke="url(#gradient)" 
                strokeWidth="12" 
                fill="none"
                strokeDasharray={`${(results.accuracy / 100) * 440} 440`}
                className="transition-all duration-1000 hidden sm:block"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {results.accuracy}%
                </div>
                <div className="text-xs text-gray-500 font-semibold">Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border-2 border-green-200">
            <div className="text-2xl sm:text-3xl font-black text-green-600">{results.correct}</div>
            <div className="text-xs sm:text-sm text-green-700 font-semibold">Correct</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border-2 border-red-200">
            <div className="text-2xl sm:text-3xl font-black text-red-600">{results.wrong}</div>
            <div className="text-xs sm:text-sm text-red-700 font-semibold">Wrong</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border-2 border-gray-200">
            <div className="text-2xl sm:text-3xl font-black text-gray-600">{results.skipped}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-semibold">Skipped</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => smoothTransition(() => setShowReview(true))}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base font-bold rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Review Answers
            </span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 sm:py-4 bg-white border-2 border-indigo-600 text-indigo-600 text-sm sm:text-base font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => smoothTransition(() => navigate('/solo-mode'))}
            className="w-full py-3 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-bold rounded-xl hover:bg-gray-50 transition-all duration-300"
          >
            Generate New Quiz
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes elegant-fall {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(${-20 + Math.random() * 40}px);
            opacity: 0;
          }
        }
        .animate-elegant-fall {
          animation: elegant-fall forwards;
        }
        @keyframes page-enter {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes page-exit {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-page-enter {
          animation: page-enter 0.3s ease-out;
        }
        .animate-page-exit {
          animation: page-exit 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default SoloResults;