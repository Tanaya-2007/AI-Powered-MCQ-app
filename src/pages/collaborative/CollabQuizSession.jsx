import React, { useState, useEffect, useMemo } from 'react';
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
  const [participantAnswers, setParticipantAnswers] = useState([]); // Stores {participantId, answer}
  const [currentParticipants, setCurrentParticipants] = useState(participants);
  const isHost = participants[0]?.isHost || false; // First participant is host

  const question = quizData.questions[currentQuestion];
  const totalQuestions = quizData.questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  // Pre-calculate random values for confetti
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

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !showResultScreen) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResultScreen) {
      // Time's up - host must manually show results
      if (isHost) {
        // Auto-show results for host
        setShowResultScreen(true);
      }
    }
  }, [timeLeft, showResultScreen, isHost]);

  // Simulate participants answering (REMOVE IN PRODUCTION)
  useEffect(() => {
    if (!showResultScreen) {
      const interval = setInterval(() => {
        if (participantAnswers.length < currentParticipants.length - 1) {
          // Random participant answers random option
          const unansweredParticipants = currentParticipants.filter(p => 
            !participantAnswers.find(pa => pa.participantId === p.id) && !p.isHost
          );
          
          if (unansweredParticipants.length > 0) {
            const randomParticipant = unansweredParticipants[Math.floor(Math.random() * unansweredParticipants.length)];
            const randomAnswer = Math.floor(Math.random() * question.options.length);
            
            setParticipantAnswers(prev => [...prev, {
              participantId: randomParticipant.id,
              participant: randomParticipant,
              answer: randomAnswer
            }]);
          }
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [participantAnswers, showResultScreen, currentParticipants, question.options.length]);

  const handleSelectAnswer = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    // Add host's answer
    const host = currentParticipants.find(p => p.isHost);
    setParticipantAnswers(prev => [...prev, {
      participantId: host.id,
      participant: host,
      answer: index
    }]);
  };

  const handleShowResults = () => {
    if (!isHost) return;
    setShowResultScreen(true);
  };

  const handleNextQuestion = () => {
    if (!isHost) return;
    
    if (isLastQuestion) {
      navigate('/collab/results', { 
        state: { quizCode, participants: currentParticipants, quizData } 
      });
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(timePerQuestion || 60);
      setShowResultScreen(false);
      setParticipantAnswers([]);
    }
  };

  const handleEndQuiz = () => {
    if (!isHost) return;
    navigate('/collab/results', { 
      state: { quizCode, participants: currentParticipants, quizData } 
    });
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return 'from-red-500 to-pink-600';
    if (timeLeft <= 10) return 'from-orange-500 to-red-500';
    return 'from-indigo-500 to-purple-600';
  };

  // Calculate vote statistics for each option
  const getVoteStats = () => {
    const totalVotes = participantAnswers.length;
    return question.options.map((option, index) => {
      const votes = participantAnswers.filter(pa => pa.answer === index).length;
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      return { option, index, votes, percentage, isCorrect: index === question.correctAnswer };
    });
  };

  // Between Questions Result Screen
  if (showResultScreen) {
    const voteStats = getVoteStats();
    const correctVotes = voteStats.find(s => s.isCorrect)?.votes || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden flex items-center justify-center px-4 py-8">
        {/* Animated Background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 2px, transparent 2px)`,
            backgroundSize: '50px 50px',
            animation: 'moveDots 20s linear infinite'
          }}
        />
  
        {/* Confetti */}
        {correctVotes > 0 && (
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
  
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-6 sm:p-8 md:p-12 max-w-4xl w-full relative z-10 animate-scale-in">
          {/* Header with Trophy Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
              <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-10"></div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3">
              Answer Revealed!
            </h2>
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border-2 border-green-300">
              <span className="text-2xl">🎯</span>
              <p className="text-lg font-black text-gray-900">
                {correctVotes} {correctVotes === 1 ? 'player' : 'players'} got it right
              </p>
            </div>
          </div>
  
          {/* Statistics - ALL OPTIONS with Modern Design */}
          <div className="space-y-4 mb-8">
            {voteStats.sort((a, b) => b.percentage - a.percentage).map((stat, idx) => (
              <div 
                key={stat.index}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-500 transform hover:scale-102 ${
                  stat.isCorrect
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg shadow-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  animation: 'slideInRight 0.5s ease-out forwards'
                }}
              >
                {/* Animated Progress Bar */}
                <div 
                  className={`absolute inset-0 transition-all duration-1000 ease-out ${
                    stat.isCorrect 
                      ? 'bg-gradient-to-r from-green-300/40 to-emerald-300/40' 
                      : 'bg-gradient-to-r from-indigo-200/30 to-purple-200/30'
                  }`}
                  style={{ 
                    width: `${stat.percentage}%`,
                    transformOrigin: 'left'
                  }}
                />
  
                {/* Content */}
                <div className="relative p-4 sm:p-5 md:p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Option Letter with Glow */}
                    <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-xl transition-all ${
                      stat.isCorrect
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110 shadow-green-400'
                        : stat.votes > 0
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + stat.index)}
                      {stat.isCorrect && (
                        <div className="absolute inset-0 rounded-xl animate-ping bg-green-400 opacity-20"></div>
                      )}
                    </div>
  
                    {/* Option Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-base sm:text-lg md:text-xl font-black truncate ${
                        stat.isCorrect ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {stat.option}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">
                        {stat.votes} {stat.votes === 1 ? 'vote' : 'votes'}
                      </p>
                    </div>
                  </div>
  
                  {/* Percentage & Icon */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-2xl sm:text-3xl md:text-4xl font-black tabular-nums ${
                        stat.isCorrect 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                          : 'text-gray-700'
                      }`}>
                        {stat.percentage}%
                      </div>
                    </div>
                    
                    {stat.isCorrect && (
                      <div className="animate-bounce-slow">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
  
          {/* Host Controls - ONLY HOST SEES THIS */}
          {isHost ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleNextQuestion}
                className="flex-1 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg sm:text-xl font-black rounded-2xl shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLastQuestion ? '🏆 Show Final Results' : '➡️ Next Question'}
                </span>
              </button>
              <button
                onClick={handleEndQuiz}
                className="px-6 py-4 sm:py-5 bg-white border-2 border-red-500 text-red-600 text-lg font-bold rounded-2xl hover:bg-red-50 transition-all duration-300"
              >
                End Quiz
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-base font-bold text-gray-700">Waiting for host...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Participants who have answered
  const answeredParticipants = participantAnswers.map(pa => pa.participant);
  const displayParticipants = currentParticipants.slice(0, 15);
  const hiddenCount = currentParticipants.length - 15;

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
      {/* Top Bar - FIXED & RESPONSIVE */}
<div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl shadow-xl border-b border-indigo-200/50">
  <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
    <div className="flex items-center justify-between flex-wrap gap-2">
      {/* Quiz Title - SMALLER ON MOBILE */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base sm:text-lg font-black text-gray-900">{quizData.title}</h1>
          <p className="text-xs text-gray-500 font-semibold">Live Arena ⚡</p>
        </div>
      </div>

      {/* Question Counter */}
      <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg sm:rounded-xl border-2 border-indigo-300">
        <span className="text-xs sm:text-sm font-bold text-gray-700">Q</span>
        <span className="text-lg sm:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {currentQuestion + 1}/{totalQuestions}
        </span>
      </div>

      {/* Timer - COMPACT ON MOBILE */}
      <div className={`px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r ${getTimerColor()} rounded-xl sm:rounded-2xl shadow-xl ${timeLeft <= 10 ? 'animate-pulse' : ''} transition-all duration-300`}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xl sm:text-3xl font-black text-white tabular-nums">{timeLeft}s</span>
        </div>
      </div>

      {/* Participants Count */}
      <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg sm:rounded-xl border-2 border-green-300">
        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        <span className="text-base sm:text-xl font-black text-gray-900">{currentParticipants.length}</span>
      </div>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="relative z-20 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Question Card - RESPONSIVE TEXT */}
<div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-3 border-indigo-300 p-4 sm:p-6 md:p-10 mb-6 relative overflow-hidden animate-glow">
  {/* Gradient Accent */}
  <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
  
  <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
      <span className="text-xl sm:text-3xl font-black text-white">Q{currentQuestion + 1}</span>
    </div>
    <div className="flex-1">
      <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
        {question.question}
      </h2>
    </div>
  </div>

  {/* Options Grid - RESPONSIVE */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
    {question.options.map((option, index) => {
      const isSelected = selectedAnswer === index;
      
      return (
        <button
          key={index}
          onClick={() => handleSelectAnswer(index)}
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
    <div className="text-center animate-bounce-once">
      <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl sm:rounded-2xl shadow-2xl">
        <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-base sm:text-xl font-black">Answer Locked ✅</span>
      </div>
    </div>
  )}
</div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
   {/* Live Answer Status - CLEAN FOR ANY NUMBER */}
<div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      Live Answers
    </h3>
    <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
      <span className="text-lg font-black text-gray-900">
        {answeredParticipants.length} / {currentParticipants.length}
      </span>
    </div>
  </div>

  {/* Show avatars ONLY if <= 8 participants */}
  {currentParticipants.length <= 8 ? (
    <>
      {/* Avatar Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-6">
        {currentParticipants.map((participant) => {
          const hasAnswered = answeredParticipants.find(p => p.id === participant.id);
          
          return (
            <div 
              key={participant.id}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-3 shadow-lg transition-all duration-500 ${
                hasAnswered
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 scale-110 animate-bounce-once'
                  : 'bg-gray-100 border-gray-300 opacity-50'
              }`}>
                {participant.avatar}
              </div>
              <span className={`text-xs font-bold truncate w-full text-center transition-colors ${
                hasAnswered ? 'text-green-700' : 'text-gray-400'
              }`}>
                {participant.name}
              </span>
            </div>
          );
        })}
      </div>
    </>
  ) : (
    /* For >8 participants, show ONLY percentage */
    <div className="text-center py-8">
      <div className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
        {Math.round((answeredParticipants.length / currentParticipants.length) * 100)}%
      </div>
      <p className="text-sm text-gray-600 font-semibold">of players answered</p>
    </div>
  )}

  {/* Progress Bar - ALWAYS SHOW */}
  <div className="mt-6">
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
      <div 
        className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-500 rounded-full relative overflow-hidden"
        style={{ width: `${(answeredParticipants.length / currentParticipants.length) * 100}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
      </div>
    </div>
  </div>
</div>

            {/* Host Controls - ONLY VISIBLE TO HOST */}
            {isHost && (
              <div className="lg:col-span-1 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl border-3 border-yellow-300 p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Host Controls</h3>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleShowResults}
                    disabled={timeLeft === 0}
                    className="w-full px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Show Results
                      </button>
                      <button
                onClick={handleEndQuiz}
                className="w-full px-4 py-3 bg-white border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                End Quiz
              </button>

              <div className="pt-4 border-t-2 border-yellow-300">
                <div className="text-xs text-gray-600 space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Waiting: {currentParticipants.length - answeredParticipants.length}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Answered: {answeredParticipants.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>

  <style jsx>{`
    @keyframes moveDots {
      0% { transform: translate(0, 0); }
      100% { transform: translate(50px, 50px); }
    }

    @keyframes glow {
      0%, 100% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 0 60px rgba(99, 102, 241, 0.6); }
    }

    .animate-glow {
      animation: glow 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .animate-shimmer {
      animation: shimmer 2s infinite;
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

   @keyframes elegant-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(110vh) rotate(360deg);
    opacity: 0;
  }
}

    .animate-elegant-fall {
      animation: elegant-fall forwards;
    }

    @keyframes slideInRight {
  0% {
    transform: translateX(50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.hover:scale-102:hover {
  transform: scale(1.02);
}
  `}</style>
</div>   
);
}
export default CollabQuizSession