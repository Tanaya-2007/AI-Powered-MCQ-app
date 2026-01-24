// 📄 NEW FILE: src/components/QuestionCard.jsx

import React from 'react';

function QuestionCard({ 
  question, 
  currentQuestion, 
  totalQuestions,
  timeLeft,
  selectedAnswer,
  isAnswered,
  onSelectAnswer 
}) {
  
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'from-red-500 to-pink-600';
    if (timeLeft <= 10) return 'from-orange-500 to-red-500';
    return 'from-indigo-500 to-purple-600';
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-3 border-indigo-300 p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      {/* Header with Question Number & Timer */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        {/* Question Number */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-xl sm:text-3xl font-black text-white">Q{currentQuestion + 1}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-gray-500 font-semibold">Question</p>
            <p className="text-lg font-black text-gray-900">{currentQuestion + 1} of {totalQuestions}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r ${getTimerColor()} rounded-xl sm:rounded-2xl shadow-xl ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{timeLeft}s</span>
          </div>
        </div>
      </div>
      
      {/* Question Text */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
          {question.question}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(index)}
              disabled={isAnswered}
              className={`group relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-3 text-left transition-all duration-300 ${
                isAnswered
                  ? isSelected
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-500 shadow-2xl scale-105'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                  : 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 hover:scale-105 hover:shadow-2xl cursor-pointer active:scale-95'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-base sm:text-xl transition-all ${
                  isAnswered
                    ? isSelected
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110 shadow-lg'
                      : 'bg-gray-300 text-gray-600'
                    : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white group-hover:scale-110'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`text-sm sm:text-base md:text-lg font-bold flex-1 ${
                  isAnswered
                    ? isSelected
                      ? 'text-indigo-900'
                      : 'text-gray-500'
                    : 'text-gray-900 group-hover:text-indigo-900'
                }`}>
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Answer Submitted Indicator */}
      {isAnswered && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl sm:rounded-2xl shadow-2xl animate-bounce-once">
            <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-base sm:text-xl font-black">Answer Locked ✅</span>
          </div>
        </div>
      )}

      <style jsx>{`
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

export default QuestionCard;