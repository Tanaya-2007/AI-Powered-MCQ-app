import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionCard from '../../components/collab/QuestionCard';
import LiveLeaderboardMini from '../../components/collab/LiveLeaderboardMini';
import QuestionResultPage from './QuestionResultPage';
import FinalLeaderboardPage from './FinalLeaderboardPage';

function CollabQuizSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const {timePerQuestion, participants } = location.state || {};

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
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const isHost = participants[0]?.isHost || false; // First participant is host

  const question = quizData.questions[currentQuestion];
  const totalQuestions = quizData.questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  //  // Timer countdown
  // useEffect(() => {
  //   if (timeLeft > 0 && !showResultScreen) {
  //     const timer = setTimeout(() => {
  //       setTimeLeft(timeLeft - 1);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   } else if (timeLeft === 0 && !showResultScreen) {
  //     // Time's up - host must manually show results
  //     if (isHost) {
  //       // Auto-show results for host
  //       setShowQuestionResult(true);
  //     }
  //   }
  // }, [timeLeft, showResultScreen, isHost]);

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
    setShowQuestionResult(true); 
  };

  const handleNextQuestion = () => {
    if (!isHost) return;
    
    if (isLastQuestion) {
      setShowFinalLeaderboard(true); 
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(timePerQuestion || 60);
      setShowQuestionResult(false); 
      setParticipantAnswers([]);
    }
  };

  const handleEndQuiz = () => {
    if (!isHost) return;
    setShowFinalLeaderboard(true); 
  };

 
  if (showFinalLeaderboard) {
    return (
      <FinalLeaderboardPage
        participants={currentParticipants}
        onExit={() => navigate('/')}
      />
    );
  }

  if (showQuestionResult) {
    return (
      <QuestionResultPage
        question={question}
        selectedAnswer={selectedAnswer}
        participants={currentParticipants}
        onNextQuestion={handleNextQuestion}
        isLastQuestion={isLastQuestion}
        autoRedirectTime={5}
      />
    );
  }



// 📝 REPLACE YOUR MAIN return STATEMENT WITH THIS CLEAN LAYOUT:

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden animate-page-enter">
    {/* Animated Background - KEEP YOUR EXISTING CODE */}
    <div 
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 2px, transparent 2px)`,
        backgroundSize: '50px 50px',
        animation: 'moveDots 20s linear infinite'
      }}
    ></div>

    {/* Floating Orbs - KEEP YOUR EXISTING CODE */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>

    {/* Top Bar - KEEP YOUR EXISTING TOP BAR CODE */}
    <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl shadow-xl border-b border-indigo-200/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* YOUR EXISTING TOP BAR CONTENT - Quiz Title, Question Counter, Timer, Participants */}
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="relative z-20 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SIDE: Question Card Component */}
          <div className="lg:col-span-2">
            <QuestionCard
              question={question}
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
              timeLeft={timeLeft}
              selectedAnswer={selectedAnswer}
              isAnswered={isAnswered}
              onSelectAnswer={handleSelectAnswer}
            />
          </div>

          {/* RIGHT SIDE: Live Leaderboard + Host Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Leaderboard Mini */}
            <LiveLeaderboardMini 
              participants={currentParticipants} 
              maxShow={5} 
            />
            
            {/* Host Controls - ONLY VISIBLE TO HOST */}
            {isHost && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl border-3 border-yellow-300 p-6 shadow-xl">
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
                    className="w-full px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
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
                        Answered: {participantAnswers.length}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Waiting: {currentParticipants.length - participantAnswers.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>

    {/* KEEP YOUR EXISTING STYLES */}
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
    `}</style>
  </div>
);
}
export default CollabQuizSession