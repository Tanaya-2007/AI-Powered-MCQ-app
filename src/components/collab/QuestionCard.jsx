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
      
      <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 p-6 sm:p-8 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {/* Question Number */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-2xl font-black text-white">Q{currentQuestion + 1}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Question</p>
            <p className="text-base font-bold text-gray-900">{currentQuestion + 1} / {totalQuestions}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`px-5 py-3 bg-gradient-to-r ${getTimerColor()} rounded-2xl shadow-md ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-2xl font-black text-white tabular-nums">{timeLeft}s</span>
          </div>
        </div>
      </div>
      
      {/* Question */}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-8">
        {question.question}
      </h2>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(index)}
              disabled={isAnswered}
              className={`group p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                isAnswered
                  ? isSelected
                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md cursor-pointer active:scale-98'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                  isAnswered
                    ? isSelected
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
                      : 'bg-gray-300 text-gray-600'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`text-base font-medium flex-1 ${
                  isAnswered
                    ? isSelected ? 'text-indigo-900' : 'text-gray-500'
                    : 'text-gray-900 group-hover:text-indigo-900'
                }`}>
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Locked Indicator */}
      {isAnswered && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-md">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-base font-bold">Answer Locked</span>
          </div>
        </div>
      )}
    </div>

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