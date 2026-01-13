import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function QuizSession() {
  const navigate = useNavigate();
  
  // Mock quiz data - Replace with actual data from props/API later
  const quizData = {
    title: "AI Generated Quiz",
    difficulty: "medium",
    totalQuestions: 10,
    timePerQuestion: 60,
    questions: [
      {
        id: 1,
        question: "Which protocol is used for secure web communication?",
        options: ["HTTP", "HTTPS", "FTP", "SMTP"],
        correctAnswer: 1,
        explanation: "HTTPS (Hypertext Transfer Protocol Secure) uses SSL/TLS encryption to secure data transmission between client and server."
      },
      {
        id: 2,
        question: "What does CPU stand for?",
        options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing User"],
        correctAnswer: 0,
        explanation: "CPU stands for Central Processing Unit, which is the primary component of a computer that performs most of the processing."
      },
      {
        id: 3,
        question: "What is the purpose of RAM in a computer?",
        options: ["Long-term storage", "Temporary data storage", "Processing calculations", "Display graphics"],
        correctAnswer: 1,
        explanation: "RAM (Random Access Memory) is used for temporary storage of data that the CPU needs quick access to while running programs."
      },
      // Add more questions as needed
    ]
  };
  // States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizData.timePerQuestion);
  const [answers, setAnswers] = useState(Array(quizData.totalQuestions).fill(null));
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.totalQuestions) * 100;
  

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && !quizComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleNextQuestion();
    }
  }, [timeLeft, isAnswered, quizComplete]);

  // Keyboard shortcuts (A, B, C, D)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (quizComplete || showReview) return;
      
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && !isAnswered) {
        const optionIndex = key.charCodeAt(0) - 65;
        if (optionIndex < question.options.length) {
          handleSelectAnswer(optionIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, currentQuestion, quizComplete, showReview]);

  const handleSelectAnswer = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setTimeLeft(quizData.timePerQuestion);
    } else {
      setQuizComplete(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setIsAnswered(answers[currentQuestion - 1] !== null);
      setShowExplanation(false);
      setTimeLeft(quizData.timePerQuestion);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizComplete(true);
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    answers.forEach((answer, index) => {
      if (answer === null) {
        skipped++;
      } else if (answer === quizData.questions[index].correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const accuracy = ((correct / quizData.totalQuestions) * 100).toFixed(1);
    return { correct, wrong, skipped, accuracy };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'from-green-500 to-emerald-600';
      case 'medium': return 'from-yellow-500 to-orange-600';
      case 'hard': return 'from-red-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // RESULTS PAGE
  if (quizComplete && !showReview) {
    const results = calculateResults();
    const isHighScore = results.accuracy >= 80;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
        {/* Confetti for high scores */}
        {isHighScore && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}

        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-gray-600">
              {isHighScore ? "Outstanding Performance! 🎉" : "Good effort! Keep practicing! 💪"}
            </p>
          </div>

          {/* Score Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="70" stroke="#E5E7EB" strokeWidth="12" fill="none" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  stroke="url(#gradient)" 
                  strokeWidth="12" 
                  fill="none"
                  strokeDasharray={`${(results.accuracy / 100) * 440} 440`}
                  className="transition-all duration-1000"
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
                  <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {results.accuracy}%
                  </div>
                  <div className="text-xs text-gray-500 font-semibold">Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border-2 border-green-200">
              <div className="text-3xl font-black text-green-600">{results.correct}</div>
              <div className="text-sm text-green-700 font-semibold">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 text-center border-2 border-red-200">
              <div className="text-3xl font-black text-red-600">{results.wrong}</div>
              <div className="text-sm text-red-700 font-semibold">Wrong</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 text-center border-2 border-gray-200">
              <div className="text-3xl font-black text-gray-600">{results.skipped}</div>
              <div className="text-sm text-gray-700 font-semibold">Skipped</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowReview(true)}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Review Answers
              </span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => navigate('/solo-mode')}
              className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300"
            >
              Generate New Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // REVIEW MODE
  if (showReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">Review Answers</h2>
              <button
                onClick={() => setShowReview(false)}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Back to Results
              </button>
            </div>
          </div>

          {/* All Questions */}
          <div className="space-y-6">
            {quizData.questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.correctAnswer;
              const isSkipped = userAnswer === null;

              return (
                <div key={q.id} className="bg-white rounded-2xl shadow-xl p-6">
                  {/* Question Header */}
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

                  {/* Options */}
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

                  {/* Explanation */}
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
      </div>
    );
  }

// MAIN QUIZ SESSION
return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
    {/* Exit Confirmation Popup */}
    {showExitConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Exit Quiz?</h3>
            <p className="text-gray-600">Your progress will be lost. Are you sure?</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate('/solo-mode')}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Top Header */}
    <div className="bg-white shadow-lg border-b-2 border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          {/* Quiz Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">{quizData.title}</h1>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 bg-gradient-to-r ${getDifficultyColor(quizData.difficulty)} text-white text-xs font-bold rounded capitalize`}>
                  {quizData.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Progress & Timer */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900">
                Question {currentQuestion + 1} / {quizData.totalQuestions}
              </div>
              <div className="text-xs text-gray-500">Progress: {Math.round(progress)}%</div>
            </div>
            
            {/* Timer */}
            <div className={`px-4 py-2 rounded-xl font-bold ${
              timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Exit Button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-white">Q{currentQuestion + 1}</span>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-gray-900 leading-relaxed">
              {question.question}
            </p>
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="mb-6">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`}
              style={{ width: `${(timeLeft / quizData.timePerQuestion) * 100}%` }}
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showResult = isAnswered;

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={isAnswered}
                className={`w-full p-5 rounded-2xl border-3 text-left transition-all duration-300 ${
                  showResult
                    ? isCorrect
                      ? 'bg-green-50 border-green-500 shadow-lg'
                      : isSelected
                      ? 'bg-red-50 border-red-500 shadow-lg'
                      : 'bg-gray-50 border-gray-200'
                    : isSelected
                    ? 'bg-indigo-50 border-indigo-500 shadow-xl scale-105'
                    : 'bg-white border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-102'
                } ${!isAnswered && 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    showResult
                      ? isCorrect
                        ? 'bg-green-500 text-white'
                        : isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                      : isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={`text-lg font-semibold ${
                    showResult
                      ? isCorrect
                        ? 'text-green-900'
                        : isSelected
                        ? 'text-red-900'
                        : 'text-gray-600'
                      : isSelected
                      ? 'text-indigo-900'
                      : 'text-gray-700'
                  }`}>
                    {option}
                  </span>
                  {showResult && isCorrect && (
                    <svg className="w-6 h-6 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <svg className="w-6 h-6 text-red-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation Toggle */}
        {isAnswered && (
          <div className="mb-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full py-3 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className={`w-5 h-5 transition-transform ${showExplanation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </button>
            
            {showExplanation && (
              <div className="mt-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-indigo-700">{question.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          
          {currentQuestion < quizData.totalQuestions - 1 ? (
            <button
              onClick={handleNextQuestion}
              disabled={!isAnswered}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all"
            >
              Submit Quiz ✓
            </button>
          )}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {Array.from({ length: quizData.totalQuestions }).map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              answers[index] !== null
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                : index === currentQuestion
                ? 'bg-indigo-400 scale-125'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  </div>
);
}

export default QuizSession;