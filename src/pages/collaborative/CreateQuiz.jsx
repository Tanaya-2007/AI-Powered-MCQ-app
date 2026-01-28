import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

function SoloMode() {
  const navigate = useNavigate();
  
  // States
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [customTime, setCustomTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  const [quizCode, setQuizCode] = useState('');

  const generateQuizCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const generateMockQuestions = (count) => {
  const topics = ['JavaScript', 'React', 'Python', 'Java', 'CSS'];
  const mockQuestions = [];
  
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    mockQuestions.push({
      id: i + 1,
      question: `What is the main feature of ${topic}?`,
      options: [
        `${topic} feature A`,
        `${topic} feature B`,
        `${topic} feature C`,
        `${topic} feature D`
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    });
  }
  return mockQuestions;
};

const showToastMessage = (message) => {
  setToastMessage(message);
  setShowToast(true);
  setTimeout(() => {
    setShowToast(false);
  }, 3000);
};

  const handleFileUpload = (file) => {
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleGenerateQuiz = () => {
    // Validate number of questions FIRST
    const questions = parseInt(numQuestions) || 0;
    if (questions === 0) {
      alert('❌ Please enter number of questions');
      return;
    }
    if (questions > 100) {
      alert('⚠️ Maximum 100 questions allowed! Please reduce the number.');
      return;
    }
  
    // Validate time per question
    const time = customTime ? parseInt(customTime) : timePerQuestion;
    if (time === 0) {
      alert('❌ Please enter time per question');
      return;
    }
    if (time > 300) {
      alert('⚠️ Time cannot exceed 5 minutes (300 seconds)! Please reduce the time.');
      return;
    }
  
    // Validate content input
    if (!textInput && !uploadedFile) {
      alert('❌ Please provide study material (text, image, or PDF)');
      return;
    }
  
    setIsGenerating(true);

    setTimeout(() => {
      const newCode = generateQuizCode();
      const mockQuestions = generateMockQuestions(questions); 
      
      setQuizCode(newCode);
      setGeneratedQuestions(mockQuestions); 
      setIsGenerating(false);
      setQuizReady(true);
    }, 3000);
  };

  const handleEditQuestion = (index) => {
    setEditingQuestionIndex(index);
    setShowEdit(true);
    setShowPreview(false);
  };
  
  const handleSaveEdit = (updatedQuestion) => {
    const updated = [...generatedQuestions];
    updated[editingQuestionIndex] = updatedQuestion;
    setGeneratedQuestions(updated);
    setShowEdit(false);
    setEditingQuestionIndex(null);
    showToastMessage('✅ Question updated successfully!');
  };
  
  const handleDeleteQuestion = (index) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updated = generatedQuestions.filter((_, i) => i !== index);
      setGeneratedQuestions(updated);
      setNumQuestions(updated.length.toString());
      showToastMessage('🗑️ Question deleted!');
    }
  };

  const handleBeginQuiz = () => {
    // Navigate to quiz lobby
    navigate('/collab/quiz-lobby', { 
      state: { quizCode: 'ABC123', difficulty, numQuestions, timePerQuestion: customTime || timePerQuestion } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden animate-page-enter">
       {/* Quiz Ready POPUP */}
       {quizReady && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in overflow-y-auto py-8">
    <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 transform scale-100 animate-scale-in">
      {/* Close Button */}
      <button
        onClick={() => {
          setQuizReady(false);
          setShowPreview(false);
          setShowEdit(false);
        }}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* CONDITIONAL RENDERING - Main View vs Preview vs Edit */}
      {!showPreview && !showEdit ? (
        <>
          {/* YOUR EXISTING SUCCESS SCREEN CODE - ALL OF IT */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-once">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">Quiz Created Successfully! 🎉</h3>
            <p className="text-gray-600">Review your quiz settings below</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: Quiz Code & Info */}
            <div className="space-y-6">
              {/* Quiz Code Display */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-center">
                <p className="text-white/80 text-sm font-semibold mb-2">Quiz Code</p>
                <div className="text-5xl font-black text-white tracking-wider mb-3">
                  {quizCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(quizCode);
                    showToastMessage('✅ Code copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-lg backdrop-blur-sm transition-all"
                >
                  📋 Copy Code
                </button>
              </div>

              {/* Quiz Settings - EDITABLE */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-gray-900">Quiz Settings</h4>
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">EDITABLE</span>
                </div>

                <div className="space-y-4">
                  {/* Number of Questions - EDITABLE */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Number of Questions</label>
                    <input
                      type="number"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(e.target.value)}
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-center"
                    />
                  </div>

                  {/* Time Per Question - EDITABLE */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Time Per Question (seconds)</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[30, 60, 120].map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setTimePerQuestion(time);
                            setCustomTime('');
                          }}
                          className={`py-2 rounded-lg font-semibold text-sm transition-all ${
                            (customTime ? parseInt(customTime) : timePerQuestion) === time
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {time}s
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      placeholder="Or enter custom time"
                      max="300"
                      className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Difficulty - EDITABLE */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-600' },
                        { value: 'medium', label: 'Medium', color: 'from-yellow-500 to-orange-600' },
                        { value: 'hard', label: 'Hard', color: 'from-red-500 to-pink-600' }
                      ].map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setDifficulty(level.value)}
                          className={`py-2 rounded-lg font-bold text-sm transition-all ${
                            difficulty === level.value
                              ? `bg-gradient-to-r ${level.color} text-white shadow-lg`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Changes Button */}
                  <button
                    onClick={() => {
                      showToastMessage('✅ Settings updated successfully!');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Quiz Preview & Review Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-gray-900">Quiz Preview</h4>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">SAMPLE</span>
                </div>

                {/* Sample Question Preview */}
                <div className="bg-white rounded-xl p-5 mb-4 border-2 border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-black">Q1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 font-semibold">Sample Question</p>
                      <p className="text-xs text-indigo-600 font-bold">{customTime || timePerQuestion}s • {difficulty}</p>
                    </div>
                  </div>
                  
                  <h5 className="text-base font-bold text-gray-900 mb-4">What is the capital of France?</h5>
                  
                  <div className="space-y-2">
                    {['Paris', 'London', 'Berlin', 'Madrid'].map((option, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
                    <p className="text-2xl font-black text-indigo-600">{generatedQuestions.length}</p>
                    <p className="text-xs text-gray-600 font-semibold">Questions</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
                    <p className="text-2xl font-black text-purple-600">{customTime || timePerQuestion}s</p>
                    <p className="text-xs text-gray-600 font-semibold">Per Question</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-gray-200">
                    <p className="text-2xl font-black text-pink-600 capitalize">{difficulty}</p>
                    <p className="text-xs text-gray-600 font-semibold">Difficulty</p>
                  </div>
                </div>

                {/* 🔥 THIS IS THE PREVIEW BUTTON - THE KEY PART YOU WERE MISSING! */}
                <button
                  onClick={() => setShowPreview(true)}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview & Edit All Questions
                </button>
                <p className="text-xs text-center text-gray-600 mt-2">
                  Review and edit questions before starting
                </p>
              </div>

              {/* Study Material Info */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <h4 className="text-sm font-black text-gray-900 mb-3">📚 Study Material</h4>
                {textInput && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Text Input</p>
                    <p className="text-sm text-gray-900 font-medium truncate">{textInput.substring(0, 50)}...</p>
                  </div>
                )}
                {uploadedFile && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Uploaded File</p>
                    <p className="text-sm text-gray-900 font-medium">{uploadedFile.name}</p>
                  </div>
                )}
                {!textInput && !uploadedFile && (
                  <p className="text-sm text-gray-500">No material uploaded</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons at Bottom */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/collab/quiz-lobby', { 
                state: { quizCode: quizCode, difficulty, numQuestions: generatedQuestions.length, timePerQuestion: customTime || timePerQuestion, questions: generatedQuestions } 
              })}
              className="py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              🚀 Go to Lobby
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            <button
              onClick={() => {
                const shareText = `Join my quiz! Code: ${quizCode}`;
                const shareUrl = `${window.location.origin}/collab/join?code=${quizCode}`;
                if (navigator.share) {
                  navigator.share({ title: 'Join Quiz', text: shareText, url: shareUrl });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  showToastMessage('🔗 Share link copied!');
                }
              }}
              className="py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              📤 Share Link
            </button>
          </div>
        </>
      ) : showPreview ? (
        <QuestionPreview
          questions={generatedQuestions}
          onEdit={handleEditQuestion}
          onDelete={handleDeleteQuestion}
          onBack={() => setShowPreview(false)}
        />
      ) : showEdit ? (
        <QuestionEditor
          question={generatedQuestions[editingQuestionIndex]}
          onSave={handleSaveEdit}
          onCancel={() => {
            setShowEdit(false);
            setShowPreview(true);
          }}
        />
      ) : null}

    </div>
  </div>
)}
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

      {/* Navigation */}
      <nav className="relative z-30 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:rotate-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              QuizMaster
            </span>
          </div>

          <button 
            onClick={() => navigate('/collaborative')}
            className="group flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white border-2 border-gray-200 rounded-lg transition-all duration-300"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-semibold">Back</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-full border border-indigo-300/30 shadow-lg mb-6">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Host Quiz Mode
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
            Create
            <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Collaborative Quiz
            </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate a quiz and share it with your students or team members
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SECTION - Input Area (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* INPUT SECTION */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
              {/* Tab Header */}
              <div className="border-b-2 border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                  Upload Study Material
                </h3>
                
                {/* Tabs */}
            <div className="flex gap-2 justify-center sm:justify-start">
              {[
                { id: 'text', label: 'Text', icon: 'M4 6h16M4 12h16M4 18h16' },
                { id: 'image', label: 'Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'pdf', label: 'PDF', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                { id: 'voice', label: 'Voice', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {/* Show label on desktop, hide on mobile */}
                  <span className="hidden sm:inline">{tab.label}</span>
                  
                  {/* Tooltip on mobile - shows on hover/touch */}
                  <span className="sm:hidden absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* TEXT INPUT */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your text content here... (lecture notes, book chapters, articles, etc.)"
                      rows="12"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-300"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{textInput.length} characters</span>
                      {textInput && (
                        <button
                          onClick={() => setTextInput('')}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* IMAGE/PDF UPLOAD */}
                {(activeTab === 'image' || activeTab === 'pdf') && (
                  <div className="space-y-4">
                    {!uploadedFile ? (
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                          isDragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          Drop your {activeTab === 'image' ? 'image' : 'PDF'} here
                        </h4>
                        <p className="text-gray-600 mb-4">or click to browse</p>
                        <label className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300">
                          Choose File
                          <input
                            type="file"
                            accept={activeTab === 'image' ? 'image/*' : '.pdf'}
                            onChange={(e) => handleFileUpload(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                        <p className="text-sm text-gray-500 mt-4">Maximum file size: 10MB</p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{uploadedFile.name}</p>
                              <p className="text-sm text-gray-600">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <label className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                              Replace
                              <input
                                type="file"
                                accept={activeTab === 'image' ? 'image/*' : '.pdf'}
                                onChange={(e) => handleFileUpload(e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={removeFile}
                              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* VOICE INPUT */}
                {activeTab === 'voice' && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Voice Input</h4>
                    <p className="text-gray-600 mb-6">Click the button below to start recording</p>
                    <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300">
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Start Recording
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SECTION - Configuration Panel (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* QUIZ CONFIGURATION */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Quiz Settings
              </h3>

              {/* Difficulty Level */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-600' },
                    { value: 'medium', label: 'Medium', color: 'from-yellow-500 to-orange-600' },
                    { value: 'hard', label: 'Hard', color: 'from-red-500 to-pink-600' }
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setDifficulty(level.value)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        difficulty === level.value
                          ? `bg-gradient-to-r ${level.color} text-white shadow-lg scale-105`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">Number of Questions</label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              placeholder="Enter number (max 100)"
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-semibold text-center text-lg"
            />
            <p className="text-xs text-gray-500 mt-2 text-center">Maximum 100 questions</p>
            {(numQuestions && parseInt(numQuestions) > 100) && (
              <p className="text-xs text-red-600 mt-2 text-center font-semibold">⚠️ Maximum 100 questions allowed!</p>
            )}
          </div>

              {/* Time Per Question */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Time Per Question</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[30, 60, 120].map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setTimePerQuestion(time);
                        setCustomTime('');
                      }}
                      className={`py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                        timePerQuestion === time && !customTime
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    setTimePerQuestion(parseInt(e.target.value) || 60);
                  }}
                  placeholder="Custom time (max 300s)"
                  className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {(customTime && parseInt(customTime) > 300) && (
                  <p className="text-xs text-red-600 font-semibold mt-2">⚠️ Maximum time is 5 minutes (300 seconds)</p>
                )}
              </div>

              {/* Generate Button */}
              {!quizReady && (
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || (!textInput && !uploadedFile)}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Quiz...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Quiz
                    </span>
                  )}
                </button>
              )}
             </div>
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 px-6 py-4 flex items-center gap-3 min-w-[320px]">
            {/* Gradient Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-l-2xl"></div>
            
            {/* Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Message */}
            <span className="text-sm font-bold text-gray-900 flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      <style jsx>{`
  @keyframes moveDots {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(50px, 50px);
    }
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

  @keyframes bounce-once {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }

  .animate-bounce-once {
    animation: bounce-once 0.6s ease-in-out;
  }
`}</style>
    </div>
  );
}

// Question Preview Component
function QuestionPreview({ questions, onEdit, onDelete, onBack }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-gray-900">Review Questions ({questions.length})</h3>
        <button onClick={onBack} className="px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200">
          ← Back
        </button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-indigo-300 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black">Q{index + 1}</span>
                </div>
                <h4 className="text-base font-bold text-gray-900">{q.question}</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(index)}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-2 text-sm font-medium ${
                    i === q.correctAnswer
                      ? 'bg-green-50 border-green-400 text-green-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="font-bold">{String.fromCharCode(65 + i)}.</span> {opt}
                  {i === q.correctAnswer && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Question Editor Component
function QuestionEditor({ question, onSave, onCancel }) {
  const [editedQuestion, setEditedQuestion] = useState({ ...question });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-gray-900">Edit Question</h3>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200">
          ← Back to Preview
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Question</label>
          <textarea
            value={editedQuestion.question}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
            rows="3"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">Options</label>
          {editedQuestion.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...editedQuestion.options];
                  newOptions[i] = e.target.value;
                  setEditedQuestion({ ...editedQuestion, options: newOptions });
                }}
                className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
              <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-green-50 hover:border-green-300">
                <input
                  type="radio"
                  name="correct"
                  checked={editedQuestion.correctAnswer === i}
                  onChange={() => setEditedQuestion({ ...editedQuestion, correctAnswer: i })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold">Correct</span>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSave(editedQuestion)}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all"
        >
          💾 Save Changes
        </button>
      </div>
    </div>
  );
}

export default SoloMode;