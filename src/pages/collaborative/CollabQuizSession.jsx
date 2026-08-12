import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../../services/socket';
import QuestionCard from '../../components/collab/QuestionCard';
import LiveLeaderboardMini from '../../components/collab/LiveLeaderboardMini';
import QuestionResultPage from './QuestionResultPage';
import FinalLeaderboardPage from './FinalLeaderboardPage';

function CollabQuizSession() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { quizCode, timePerQuestion, participants, questions, isHost: stateIsHost } = location.state || {};
  const isHost = stateIsHost || false;

  const quizData = {
    title: "AI Generated Multiplayer Quiz",
    questions: questions || []
  };

  // States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion || 60);
  const [participantAnswers, setParticipantAnswers] = useState([]);
  const [currentParticipants, setCurrentParticipants] = useState(participants || []);
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);

  const question = quizData.questions[currentQuestion];
  const totalQuestions = quizData.questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  // Timer countdown 
  useEffect(() => {
    if (timeLeft > 0 && !showQuestionResult) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }  else if (timeLeft === 0 && !showQuestionResult) {
      setShowQuestionResult(true);
    }
  }, [timeLeft, showQuestionResult]);

  // Bind WebSocket listeners for real-time multiplayer gameplay
  useEffect(() => {
    // Make sure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // Re-associate or re-join room to handle socket reconnects/refreshes cleanly
    if (isHost) {
      socket.emit('create-room', {
        roomCode: quizCode,
        quizTitle: quizData.title,
        questions: quizData.questions,
        difficulty: location.state?.difficulty,
        timePerQuestion: timePerQuestion
      });
    } else {
      const localPlayer = currentParticipants.find(p => !p.isHost) || {};
      socket.emit('join-room', {
        roomCode: quizCode,
        playerName: localPlayer.name || 'Guest',
        avatar: localPlayer.avatar || '🦊'
      });
    }

    // A. Listen for scoreboard updates from server (updates leaderboard and merges missing players)
    socket.on('scores-updated', ({ players }) => {
      setCurrentParticipants(prev => {
        const mergedList = [...prev];
        players.forEach(sp => {
          const existing = mergedList.find(p => p.name === sp.name);
          if (existing) {
            existing.score = sp.score;
            existing.avatar = sp.avatar || existing.avatar || '🧑';
            existing.totalTimeTaken = sp.totalTimeTaken;
            existing.correctAnswersCount = sp.correctAnswersCount;
          } else {
            mergedList.push({
              id: sp.id,
              name: sp.name,
              avatar: sp.avatar || '🧑', // preserve custom avatar sent by the player
              isHost: false,
              score: sp.score,
              totalTimeTaken: sp.totalTimeTaken,
              correctAnswersCount: sp.correctAnswersCount
            });
          }
        });
        return mergedList.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
        });
      });
    });

    // B. Player Listens: Host progressed to next question
    if (!isHost) {
      socket.on('show-question', ({ questionIndex }) => {
        setCurrentQuestion(questionIndex);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(timePerQuestion || 60);
        setShowQuestionResult(false);
        setParticipantAnswers([]);
      });
    }

    // C. Host & Player Listen: Quiz finished
    socket.on('quiz-finished', ({ leaderboard }) => {
      setCurrentParticipants(prev => {
        const updated = prev.map(p => {
          const matchingServerPlayer = leaderboard.find(sp => sp.name === p.name);
          return matchingServerPlayer ? { 
            ...p, 
            score: matchingServerPlayer.score,
            totalTimeTaken: matchingServerPlayer.totalTimeTaken,
            correctAnswersCount: matchingServerPlayer.correctAnswersCount
          } : p;
        });
        return updated.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
        });
      });
      setShowFinalLeaderboard(true);
    });

    // D. Room Closed (Host disconnected)
    socket.on('room-closed', ({ message }) => {
      alert(message || 'Host disconnected. Room closed.');
      navigate('/');
    });

    // E. Player Answered Listener (for Host progress tracking)
    socket.on('player-answered', ({ playerId, playerName }) => {
      setParticipantAnswers(prev => {
        if (prev.some(p => p.id === playerId)) return prev;
        return [...prev, { id: playerId, name: playerName }];
      });
    });

    return () => {
      socket.off('scores-updated');
      socket.off('show-question');
      socket.off('quiz-finished');
      socket.off('room-closed');
      socket.off('player-answered');
    };
  }, [isHost, timePerQuestion, navigate]);

  const handleSelectAnswer = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (!isHost) {
      const isCorrect = index === question.correctAnswer;
      const timeTaken = (timePerQuestion || 60) - timeLeft;
      // Emit selection to websocket server to update score
      socket.emit('submit-answer', {
        roomCode: quizCode,
        questionIndex: currentQuestion,
        isCorrect,
        timeTaken
      });
    }
  };

  const handleShowResults = () => {
    if (!isHost) return;
    setShowQuestionResult(true); 
  };

  const handleNextQuestion = () => {
    if (!isHost) return;
    
    if (isLastQuestion) {
      socket.emit('end-quiz', { roomCode: quizCode });
      setShowFinalLeaderboard(true); 
    } else {
      const nextIndex = currentQuestion + 1;
      // Tell other players to move to the next index
      socket.emit('next-question', { roomCode: quizCode, nextIndex });

      setCurrentQuestion(nextIndex);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(timePerQuestion || 60);
      setShowQuestionResult(false); 
      setParticipantAnswers([]);
    }
  };

  const handleEndQuiz = () => {
    if (!isHost) return;
    socket.emit('end-quiz', { roomCode: quizCode });
    setShowFinalLeaderboard(true); 
  };

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="text-xl font-bold text-slate-800">Loading quiz questions...</h2>
          <p className="text-sm text-slate-500">Waiting for host to synchronize room questions.</p>
        </div>
      </div>
    );
  }

  if (showFinalLeaderboard) {
    return (
      <FinalLeaderboardPage
        participants={currentParticipants}
        onExit={() => navigate('/')}
      />
    );
  }

  if (showQuestionResult) {
    const currentUser = currentParticipants.find(p => !p.isHost) || currentParticipants[0];
    
    return (
      <QuestionResultPage
        question={question}
        selectedAnswer={selectedAnswer}
        participants={currentParticipants}
        currentUserId={currentUser?.id || 'unknown'}
        isHost={isHost}
        onNextQuestion={handleNextQuestion}
        isLastQuestion={isLastQuestion}
        autoRedirectTime={5}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 2px, transparent 2px)`,
          backgroundSize: '50px 50px',
          animation: 'moveDots 20s linear infinite'
        }}
      ></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl shadow-xl border-b border-indigo-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {quizData.title}
              </h1>
            </div>

            <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 rounded-lg">
              <span className="text-sm sm:text-base font-black text-purple-700">
                👥 {currentParticipants.filter(p => !p.isHost).length} Players
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <div className="lg:col-span-1 space-y-6">
              <LiveLeaderboardMini 
                participants={currentParticipants} 
                maxShow={5} 
              />
              
              {isHost && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Host Controls</h3>
                  </div>
                  
                  <div className="space-y-2.5">
                    <button
                      onClick={handleShowResults}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Show Results
                    </button>

                    <button
                      onClick={handleEndQuiz}
                      className="w-full px-4 py-3 bg-white border-2 border-red-400 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      End Quiz
                    </button>

                    <div className="pt-3 border-t-2 border-yellow-200">
                      <div className="text-xs text-gray-600 space-y-1.5">
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Answered: {participantAnswers.length}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          Waiting: {currentParticipants.length - participantAnswers.length - 1}
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

      <style>{`
        @keyframes moveDots {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
}

export default CollabQuizSession;