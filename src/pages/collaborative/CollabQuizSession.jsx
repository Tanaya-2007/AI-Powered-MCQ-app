import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function CollabQuizSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizCode, difficulty, numQuestions, timePerQuestion, participants } = location.state || {};

  // Mock quiz data
  const quizData = {
    title: "Java Basics",
    questions: [
      {
        id: 1,
        question: "Which keyword is used to create a class in Java?",
        options: ["class", "Class", "new", "create"],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: "What is the default value of a boolean variable in Java?",
        options: ["true", "false", "null", "0"],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: "Which method is the entry point of a Java application?",
        options: ["start()", "main()", "run()", "init()"],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: "What does JVM stand for?",
        options: ["Java Virtual Machine", "Java Visual Manager", "Java Variable Method", "Java Version Manager"],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: "Which data type is used to store a single character in Java?",
        options: ["String", "char", "Character", "text"],
        correctAnswer: 1,
      },
    ]
  };

  // States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion || 60);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [answeredParticipants, setAnsweredParticipants] = useState([]);
  const isHost = true; // You would determine this based on actual user

  const question = quizData.questions[currentQuestion];
  const totalQuestions = quizData.questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResultScreen) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResultScreen) {
      handleTimeUp();
    }
  }, [timeLeft, showResultScreen]);

  // Simulate participants answering (REMOVE IN PRODUCTION)
  useEffect(() => {
    if (!isAnswered && !showResultScreen) {
      const interval = setInterval(() => {
        if (answeredParticipants.length < participants.length - 1) {
          const randomParticipant = participants.filter(p => 
            !answeredParticipants.find(ap => ap.id === p.id) && !p.isHost
          )[0];
          
          if (randomParticipant) {
            setAnsweredParticipants(prev => [...prev, randomParticipant]);
          }
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [answeredParticipants, isAnswered, showResultScreen, participants]);

  const handleSelectAnswer = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    // Add host to answered participants
    const host = participants.find(p => p.isHost);
    setAnsweredParticipants(prev => [...prev, host]);
  };

  const handleTimeUp = () => {
    setShowResultScreen(true);
    
    // Auto-transition after 3 seconds
    setTimeout(() => {
      if (isLastQuestion) {
        navigate('/collab/results', { 
          state: { quizCode, participants, quizData } 
        });
      } else {
        handleNextQuestion();
      }
    }, 3000);
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(currentQuestion + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(timePerQuestion || 60);
    setShowResultScreen(false);
    setAnsweredParticipants([]);
  };

  const handleForceNext = () => {
    if (!isHost) return;
    handleTimeUp();
  };

  const handleEndQuiz = () => {
    if (!isHost) return;
    navigate('/collab/results', { 
      state: { quizCode, participants, quizData } 
    });
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return 'from-red-500 to-pink-600';
    if (timeLeft <= 10) return 'from-orange-500 to-red-500';
    return 'from-indigo-500 to-purple-600';
  };

  // Between Questions Result Screen
  if (showResultScreen) {
    const correctAnswers = answeredParticipants.length; // Simplified - in real app, check actual answers
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-12 max-w-2xl w-full text-center animate-scale-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-once">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4">Correct Answer</h2>
          
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl font-black">
              {String.fromCharCode(65 + question.correctAnswer)}
            </div>
            <span className="text-lg font-bold text-gray-900">{question.options[question.correctAnswer]}</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-lg font-bold">🔥 {correctAnswers} players got it right</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Moving to next question...</span>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Top Bar - FIXED */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Quiz Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900">{quizData.title}</h1>
                <p className="text-xs text-gray-500 font-semibold">Live Quiz Arena</p>
              </div>
            </div>

            {/* Question Counter */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
              <span className="text-sm font-bold text-gray-600">Question</span>
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {currentQuestion + 1} / {totalQuestions}
              </span>
            </div>

            {/* Timer - BIG & VISIBLE */}
            <div className={`px-6 py-3 bg-gradient-to-r ${getTimerColor()} rounded-2xl shadow-xl ${timeLeft <= 10 ? 'animate-pulse scale-110' : ''} transition-all`}>
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-3xl font-black text-white">{timeLeft}s</span>
              </div>
            </div>

            {/* Participants Count */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-lg font-black text-gray-900">{participants.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Question Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-200 p-8 sm:p-12 mb-8 animate-glow">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl font-black text-white">Q{currentQuestion + 1}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
                  {question.question}
                </h2>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    disabled={isAnswered}
                    className={`group relative p-6 rounded-2xl border-3 text-left transition-all duration-300 ${
                      isAnswered
                        ? isSelected
                          ? 'bg-indigo-50 border-indigo-500 shadow-xl'
                          : 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-105 hover:shadow-xl cursor-pointer'
                    } ${!isAnswered && 'active:scale-95'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                        isAnswered
                          ? isSelected
                            ? 'bg-indigo-600 text-white scale-110'
                            : 'bg-gray-300 text-gray-700'
                          : 'bg-gray-200 text-gray-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={`text-base sm:text-lg font-bold ${
                        isAnswered
                          ? isSelected
                            ? 'text-indigo-900'
                            : 'text-gray-600'
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
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-xl animate-bounce-once">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-black">Answer Submitted ✅</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Answer Status - AVATAR FILL (PRESSURE BUILDER 😈) */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Answers
              </h3>
              <span className="text-sm font-bold text-gray-600">
                {answeredParticipants.length} / {participants.length} answered
              </span>
            </div>

            {/* Avatar Grid - Turn GREEN as they answer */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {participants.map((participant) => {
                const hasAnswered = answeredParticipants.find(p => p.id === participant.id);
                
                return (
                  <div 
                    key={participant.id}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-3 transition-all duration-500 ${
                      hasAnswered
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 shadow-lg scale-110'
                        : 'bg-gray-100 border-gray-300'
                    }`}>
                      {participant.avatar}
                    </div>
                    <span className={`text-xs font-semibold truncate w-full text-center ${
                      hasAnswered ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {participant.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 rounded-full"
                  style={{ width: `${(answeredParticipants.length / participants.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-black text-gray-900">Host Controls</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleForceNext}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Force Next Question
                </button>
                <button
                  onClick={handleEndQuiz}
                  className="px-6 py-3 bg-white border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  End Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes moveDots {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
          }
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }

        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default CollabQuizSession;