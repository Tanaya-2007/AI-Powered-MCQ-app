import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
function SoloQuizSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const quizConfig = location.state || {};
  
  const quizData = {
    title: "AI Generated Quiz",
    difficulty: quizConfig.difficulty || "medium",
    totalQuestions: quizConfig.numQuestions || 5,
    timePerQuestion: quizConfig.timePerQuestion || 60,
    timerEnabled: true,
    backNavigationEnabled: true,
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
      {
        id: 4,
        question: "Which programming language is known as the 'language of the web'?",
        options: ["Python", "JavaScript", "Java", "C++"],
        correctAnswer: 1,
        explanation: "JavaScript is primarily used for web development and runs in web browsers, making it the language of the web."
      },
      {
        id: 5,
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
        correctAnswer: 0,
        explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
      }
    ]
  };

  quizData.totalQuestions = quizData.questions.length;
  
  // States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [maxQuestionReached, setMaxQuestionReached] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizData.timePerQuestion);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [answers, setAnswers] = useState(Array(quizData.questions.length).fill(null));
  const [markedForReview, setMarkedForReview] = useState(Array(quizData.questions.length).fill(false));
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false); 
  const [showReviewBoard, setShowReviewBoard] = useState(false); 
  const [quizComplete, setQuizComplete] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showInvalidKeyToast, setShowInvalidKeyToast] = useState(false);

  const question = quizData.questions[currentQuestion];
  const totalQuizTime = quizData.totalQuestions * quizData.timePerQuestion;
  const remainingTime = totalQuizTime - totalTimeElapsed;
  const answeredCount = answers.filter(a => a !== null).length;
  const unansweredCount = quizData.questions.length - answeredCount;
  const markedCount = markedForReview.filter(m => m).length;
  const [pageTransition, setPageTransition] = useState('fade-in');

  
  const handleSelectAnswer = useCallback((index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
  }, [isAnswered, answers, currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (quizData.timerEnabled && timeLeft > 0 && !quizComplete) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setTotalTimeElapsed(totalTimeElapsed + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (quizData.timerEnabled && timeLeft === 0 && !quizComplete) {
      if (currentQuestion < quizData.questions.length - 1) {
        const nextIndex = currentQuestion + 1;
        setCurrentQuestion(nextIndex);
       
        if (nextIndex > maxQuestionReached) {
          setMaxQuestionReached(nextIndex);
        }
        
        setSelectedAnswer(answers[nextIndex]);
        setIsAnswered(answers[nextIndex] !== null);
        setShowExplanation(false);
        setTimeLeft(quizData.timePerQuestion);
      } else {
        const finalUnanswered = answers.filter(a => a === null).length;
        const finalMarked = markedForReview.filter(m => m).length;
        
        if (finalUnanswered > 0 || finalMarked > 0) {
          setShowSubmitConfirm(true);
        } else {
          setQuizComplete(true);
        }
      }
    }
    
    if (quizData.timerEnabled && remainingTime <= 0 && !quizComplete) {
      setQuizComplete(true);
    }
  }, [timeLeft, quizComplete, totalTimeElapsed, remainingTime, quizData.timerEnabled, currentQuestion, quizData.questions.length, quizData.timePerQuestion, answers, markedForReview, maxQuestionReached]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (quizComplete || showReview || isAnswered) return;
      
      const key = e.key.toUpperCase();
      
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const optionIndex = key.charCodeAt(0) - 65;
        if (optionIndex < question.options.length) {
          handleSelectAnswer(optionIndex);
        }
      } else if (key.length === 1 && key.match(/[A-Z]/)) {
        setShowInvalidKeyToast(true);
        setTimeout(() => {
          setShowInvalidKeyToast(false);
        }, 2000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, currentQuestion, quizComplete, showReview, question, handleSelectAnswer]);

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      
      if (nextIndex > maxQuestionReached) {
        setMaxQuestionReached(nextIndex);
      }
      
      setSelectedAnswer(answers[nextIndex]); 
      setIsAnswered(answers[nextIndex] !== null); 
      setShowExplanation(false);
      setTimeLeft(quizData.timePerQuestion);
    } else {
      if (unansweredCount > 0 || markedCount > 0) {
        setShowSubmitConfirm(true);
      } else {
        setQuizComplete(true);
      }
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

  const handleJumpToQuestion = (index) => {
    setCurrentQuestion(index);
    
    if (index > maxQuestionReached) {
      setMaxQuestionReached(index);
    }
    
    setSelectedAnswer(answers[index]);
    setIsAnswered(answers[index] !== null);
    setShowExplanation(false);
    setTimeLeft(quizData.timePerQuestion);
    setShowReviewBoard(false);
  };
  
  const toggleMarkForReview = () => {
    const newMarked = [...markedForReview];
    newMarked[currentQuestion] = !newMarked[currentQuestion];
    setMarkedForReview(newMarked);
  };
  
  const getQuestionStatus = (index) => {
    if (markedForReview[index]) return 'marked';
    if (answers[index] !== null) return 'answered';
    return 'unanswered';
  };

  const handleSubmitQuiz = () => {
    if (unansweredCount > 0 || markedCount > 0) {
      setShowSubmitConfirm(true); 
    } else {
      setQuizComplete(true); 
    }
  };
  
  const confirmSubmit = () => {
    setShowSubmitConfirm(false);
    const results = calculateResults();
    navigate('/solo-results', {
      state: {
        results,
        quizData,
        answers
      }
    });
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

  const smoothTransition = (callback) => {
    setPageTransition('fade-out');
    setTimeout(() => {
      callback();
      setPageTransition('fade-in');
    }, 300);
  };

// MAIN QUIZ SESSION
return (
  <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden ${pageTransition === 'fade-in' ? 'animate-page-enter' : 'animate-page-exit'}`}>
{/* Finish Quiz Confirmation Popup */}
{showExitConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 animate-scale-in">
      {/* Close Button */}
      <button
        onClick={() => setShowExitConfirm(false)}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-once">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Finish Quiz?</h3>
        <p className="text-sm sm:text-base text-gray-600">You can review your answers after finishing.</p>
      </div>
        
      {/* Show stats */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm sm:text-base">
          <span className="text-gray-600 font-medium">Answered:</span>
          <span className="font-bold text-green-600">{answeredCount}/{quizData.totalQuestions}</span>
        </div>
        {unansweredCount > 0 && (
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600 font-medium">Unanswered:</span>
            <span className="font-bold text-red-600">{unansweredCount}</span>
          </div>
        )}
        {markedCount > 0 && (
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600 font-medium">Marked for Review:</span>
            <span className="font-bold text-yellow-600">{markedCount}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={() => setShowExitConfirm(false)}
        className="flex-1 py-3 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-bold rounded-xl hover:bg-gray-50 transition-all duration-300"
      >
        Continue Quiz
      </button>
      <button
        onClick={() => {
          setShowExitConfirm(false);
          const results = calculateResults();
          navigate('/solo-results', {
            state: {
              results,
              quizData,
              answers
            }
          });
        }}
        className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-bold rounded-xl hover:shadow-xl transition-all duration-300"
      >
        Finish & Submit
      </button>
      </div>
    </div>
  </div>
)}

      {/* Submit Confirmation Popup */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Submit Quiz?</h3>
              <p className="text-gray-600 mb-4">You still have:</p>
              <div className="space-y-2 text-sm">
                {unansweredCount > 0 && (
                  <p className="text-gray-700">⬜ <span className="font-bold">{unansweredCount}</span> unanswered question{unansweredCount > 1 ? 's' : ''}</p>
                )}
                {markedCount > 0 && (
                  <p className="text-yellow-700">🟨 <span className="font-bold">{markedCount}</span> marked question{markedCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
            <button
            onClick={() => setShowSubmitConfirm(false)}
            className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all duration-300"
          >
            Review Again
          </button>
          <button
              onClick={() => smoothTransition(() => confirmSubmit())}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300"
            >
              Submit Anyway
            </button>
            </div>
           </div>
          </div>
          )}
                
      {/* Review Board Panel */}
      {showReviewBoard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewBoard(false)}>
          <div 
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6 animate-slide-up" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle for Mobile */}
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>

            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-black text-gray-900">Question Overview</h3>
              <button
                onClick={() => setShowReviewBoard(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

             {/* Stats */}
             <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-2 sm:p-3 text-center">
                <div className="text-xl sm:text-2xl font-black text-green-600">{answeredCount}</div>
                <div className="text-xs text-green-700 font-semibold">Answered</div>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-2 sm:p-3 text-center">
                <div className="text-xl sm:text-2xl font-black text-gray-600">{unansweredCount}</div>
                <div className="text-xs text-gray-700 font-semibold">Unanswered</div>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-2 sm:p-3 text-center">
                <div className="text-xl sm:text-2xl font-black text-yellow-600">{markedCount}</div>
                <div className="text-xs text-yellow-700 font-semibold">Marked</div>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
              {Array.from({ length: quizData.totalQuestions }).map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => handleJumpToQuestion(index)}
                    className={`aspect-square rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-110 ${
                      index === currentQuestion
                        ? 'ring-4 ring-indigo-600 ring-offset-2'
                        : ''
                    } ${
                      status === 'answered'
                        ? 'bg-green-500 text-white'
                        : status === 'marked'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    
  {/* Top Header */}
  <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        {/* Top Row - Title & Actions */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {/* Left - Quiz Info */}
          <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">QuizMaster</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 bg-gradient-to-r ${getDifficultyColor(quizData.difficulty)} text-white text-xs font-bold rounded-full capitalize shadow-sm`}>
                {quizData.difficulty}
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                Q{currentQuestion + 1}/{quizData.totalQuestions}
              </span>
            </div>
          </div>
        </div>
          {/* Right - Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Timer */}
          {quizData.timerEnabled && (
              <div className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold shadow-lg transition-all ${
                remainingTime <= 60 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-pulse scale-105' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              }`}>
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm sm:text-lg">{formatTime(remainingTime)}</span>
                </div>
              </div>
            )}

            {/* Review Board Button - Desktop */}
            <button
              onClick={() => setShowReviewBoard(true)}
              className="hidden sm:flex relative p-2.5 sm:p-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg sm:rounded-xl hover:shadow-xl hover:scale-105 transition-all shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {markedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  {markedCount}
                </span>
              )}
            </button>

            {/* Exit Button */}
            <button
              onClick={() => setShowExitConfirm(true)}
              className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg sm:rounded-xl hover:shadow-xl hover:scale-105 transition-all shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
       
      </div>
    </div>

    {/* Mobile Review Board Button - Fixed at Bottom */}
    <button
      onClick={() => setShowReviewBoard(true)}
      className="sm:hidden fixed bottom-6 right-6 z-30 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      {markedCount > 0 && (
        <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-sm font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">
          {markedCount}
        </span>
      )}
    </button>
    {/* Invalid Key Toast Notification - CLEAN MODERN DESIGN */}
    {showInvalidKeyToast && (
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 px-5 py-3 flex items-center gap-3 min-w-[280px]">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-0.5">Use A, B, C, or D only</p>
            <p className="text-xs text-gray-600">Press the correct option keys</p>
          </div>
          <button 
            onClick={() => setShowInvalidKeyToast(false)}
            className="w-7 h-7 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )}
   
    {/* Main Content */}
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 mb-6">
      <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-base sm:text-xl font-black text-white">Q{currentQuestion + 1}</span>
        </div>
        <div className="flex-1">
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 leading-relaxed">
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
            className={`w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border-3 text-left transition-all duration-300 ${
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
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-sm sm:text-lg ${
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
              <span className={`text-sm sm:text-base lg:text-lg font-semibold ${
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
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {showResult && isSelected && !isCorrect && (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>

        {/* Mark for Review Button*/}
      <button
        onClick={toggleMarkForReview}
        className={`w-full py-4 mb-6 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-102 ${
          markedForReview[currentQuestion]
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
            : 'bg-white border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {markedForReview[currentQuestion] ? 'Marked for Review' : 'Mark for Review'}
    </button>

        {/* Explanation Toggle - ONLY AFTER ANSWERING */}
        {isAnswered && (
          <div className="mb-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full py-4 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-bold rounded-2xl hover:from-indigo-200 hover:to-purple-200 transition-all flex items-center justify-center gap-2 border-2 border-indigo-300 shadow-lg"
            >
              <svg className={`w-5 h-5 transition-transform ${showExplanation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
            </button>
            
            {showExplanation && (
              <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-900 mb-2">💡 Explanation</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">{question.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div> 
        )}

     {/* Navigation Buttons */}
      <div className="flex gap-2 sm:gap-3">
        {quizData.backNavigationEnabled && ( 
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 text-sm sm:text-base font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="hidden sm:inline">← Previous</span>
            <span className="sm:hidden">←</span>
          </button>
        )}
        
        {currentQuestion < quizData.totalQuestions - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base font-bold rounded-xl hover:shadow-xl transition-all"
          >
            <span className="hidden sm:inline">Next Question →</span>
            <span className="sm:hidden">Next →</span>
          </button>
        ) : (
          <button
          onClick={handleSubmitQuiz}
          className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-bold rounded-xl hover:shadow-xl transition-all duration-300"
        >
          <span className="hidden sm:inline">Submit Quiz ✓</span>
          <span className="sm:hidden">Submit ✓</span>
        </button>
        )}
      </div>
      </div> 
    </div>
        
  </div>
);
}

export default SoloQuizSession;