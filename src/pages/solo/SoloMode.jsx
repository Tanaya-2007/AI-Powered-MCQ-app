import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function SoloMode() {
  const navigate = useNavigate();
  
  // States
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [customTime, setCustomTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Custom alert state
  const [customAlert, setCustomAlert] = useState(null); // { message: '', type: 'error' | 'success' | 'warning' }

  // Custom alert trigger helper
  const triggerAlert = (message, type = 'error') => {
    setCustomAlert({ message, type });
  };

  // Fix: Force light theme styling on mount & Init Speech Recognition
  useEffect(() => {
    document.documentElement.classList.remove('dark');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTextInput(prev => prev + ' ' + transcript);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setActiveTab('text'); // Switch tab only when recording stops or finishes
      };

      setRecognition(rec);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      triggerAlert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Opera.', 'warning');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      setActiveTab('text'); // Switch tab only when recording stops
    } else {
      // Do NOT switch to text when starting recording so user stays on Voice tab
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileUpload = (file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        triggerAlert('File size must be less than 10MB', 'warning');
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

  const handleGenerateQuiz = async () => {
    if (!topic || topic.trim() === '') {
      triggerAlert('Please enter a topic focus (e.g. Photosynthesis, databases)', 'warning');
      return;
    }

    const questionsCount = parseInt(numQuestions) || 0;
    if (questionsCount === 0) {
      triggerAlert('Please enter number of questions', 'warning');
      return;
    }
    if (questionsCount > 100) {
      triggerAlert('Maximum 100 questions allowed! Please reduce the number.', 'warning');
      return;
    }
  
    if (topic.trim().length < 2) {
      triggerAlert('Topic focus must be at least 2 characters long!', 'warning');
      return;
    }

    const time = customTime ? parseInt(customTime) : timePerQuestion;
    if (time === 0) {
      triggerAlert('Please enter time per question', 'warning');
      return;
    }
    if (time > 300) {
      triggerAlert('Time cannot exceed 5 minutes (300 seconds)! Please reduce the time.', 'warning');
      return;
    }

    setIsGenerating(true);
    let materialId = null;
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : (import.meta.env.VITE_BACKEND_URL || 'https://ai-powered-mcq-app.onrender.com');

    // Helper for resilient fetches (automatically switches to cloud backend if localhost:5000 is offline)
    const fetchWithRetry = async (url, options = {}, retries = 3) => {
      let currentUrl = url;
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(currentUrl, options);
          if (res.ok || res.status === 400) return res;
        } catch (err) {
          // If local connection fails, switch to production URL
          if (currentUrl.startsWith('http://localhost:5000') || currentUrl.startsWith('http://127.0.0.1:5000')) {
            console.warn("Local backend connection refused/failed. Switching to cloud backend...");
            const prodBase = import.meta.env.VITE_BACKEND_URL || 'https://ai-powered-mcq-app.onrender.com';
            currentUrl = currentUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, prodBase);
            continue; // retry immediately with prod URL
          }
          if (i === retries - 1) throw err;
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      return fetch(currentUrl, options);
    };

    try {
      if (activeTab === 'text' && textInput.trim() !== '') {
        const response = await fetchWithRetry(`${API_BASE_URL}/api/ingest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: textInput,
            filename: `${topic}_notes.txt`,
            topic: topic
          })
        });
        const data = await response.json();
        if (data.success) {
          materialId = data.materialId;
        } else {
          triggerAlert(`Ingestion failed: ${data.message}\nReason: ${data.reason || 'Irrelevant content.'}`, 'error');
          setIsGenerating(false);
          return;
        }
      } else if (activeTab === 'file' && uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('topic', topic);

        const response = await fetchWithRetry(`${API_BASE_URL}/api/ingest`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          materialId = data.materialId;
        } else {
          triggerAlert(`Ingestion failed: ${data.message}\nReason: ${data.reason || 'Irrelevant content.'}`, 'error');
          setIsGenerating(false);
          return;
        }
      }

      const genResponse = await fetchWithRetry(`${API_BASE_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          materialId,
          count: questionsCount,
          difficulty
        })
      });

      const genData = await genResponse.json();
      const questionsToParse = genData.questions || genData.quiz?.questions;
      if (genData.success && questionsToParse) {
        setGeneratedQuestions(questionsToParse);
        setQuizReady(true);
      } else {
        triggerAlert('Failed to generate quiz: ' + (genData.message || 'Unknown error'), 'error');
      }

    } catch (error) {
      console.error('Failed to communicate with backend API:', error);
      triggerAlert('The server is spinning up. Please click "Generate Quiz" again in 5 seconds!', 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBeginQuiz = () => {
    const time = customTime ? parseInt(customTime) : timePerQuestion;
    navigate('/quiz-session', {
      state: {
        questions: generatedQuestions,
        difficulty: difficulty,
        numQuestions: generatedQuestions.length,
        timePerQuestion: time,
        title: topic
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden animate-page-enter">
      
      {/* Custom Theme Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 animate-scale-in border border-slate-205 text-center relative">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
              {customAlert.type === 'error' && (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-650 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {customAlert.type === 'warning' && (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              {customAlert.type === 'success' && (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {customAlert.type === 'error' && 'Oops! Something went wrong'}
              {customAlert.type === 'warning' && 'Attention Required'}
              {customAlert.type === 'success' && 'Success!'}
            </h3>
            
            <p className="text-gray-600 text-sm mb-6 whitespace-pre-line leading-relaxed px-2">
              {customAlert.message}
            </p>

            <button
              onClick={() => setCustomAlert(null)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-650 text-white font-black rounded-2xl hover:shadow-xl shadow-indigo-550/20 active:scale-98 transition-all duration-200 tracking-wider text-base"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Quiz Ready POPUP */}
      {quizReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform scale-100 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setQuizReady(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-once">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-2">Quiz is Ready!</h3>
              <p className="text-gray-600">Let's test your knowledge</p>
            </div>

            {/* Quiz Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Questions:</span>
                <span className="text-gray-900 font-bold">{numQuestions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Time per question:</span>
                <span className="text-gray-900 font-bold">{customTime || timePerQuestion}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Difficulty:</span>
                <span className="text-gray-900 font-bold capitalize">{difficulty}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t-2 border-indigo-200">
                <span className="text-indigo-600 font-bold">Total Time:</span>
                <span className="text-indigo-900 font-black">
                  {Math.floor((parseInt(numQuestions) * (customTime || timePerQuestion)) / 60)} min {((parseInt(numQuestions) * (customTime || timePerQuestion)) % 60)} sec
                </span>
              </div>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-700">Keyboard Shortcuts</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Press</span>
                <div className="flex items-center gap-2">
                  {['A', 'B', 'C', 'D'].map((key) => (
                    <div key={key} className="w-9 h-9 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center shadow-sm hover:border-purple-400 hover:shadow-md transition-all">
                      <span className="text-base font-black text-gray-800">{key}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">to answer</span>
              </div>
            </div>

            {/* Begin Quiz Button */}
            <button
              onClick={handleBeginQuiz}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                🚀 Begin Quiz
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      )}
      
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

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/mode-selection')}
              className="group flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white border-2 border-gray-200 rounded-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-semibold">Back</span>
            </button>
          </div>
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
              Solo Learning Mode
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
            Create Your
            <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Perfect Quiz
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your study material and let AI generate personalized quizzes for you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Input Section (Premium Light Theme Card) */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
              {/* Tab Header */}
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
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
                          : 'bg-white text-gray-600 hover:bg-gray-55 border border-slate-200'
                      }`}
                    >
                      <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      
                      <span className="hidden sm:inline">{tab.label}</span>
                      
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
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all duration-300"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{textInput.length} characters</span>
                      {textInput && (
                        <button
                          onClick={() => setTextInput('')}
                          className="text-red-655 hover:text-red-750 font-semibold"
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
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                          isDragging
                            ? 'border-indigo-500 bg-indigo-50/50'
                            : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-655 rounded-2xl flex items-center justify-center">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          Drop your {activeTab === 'image' ? 'image' : 'PDF'} here
                        </h4>
                        <p className="text-gray-605 mb-4">or click to browse</p>
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
                      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-655 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-gray-905">{uploadedFile.name}</p>
                              <p className="text-sm text-gray-600">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <label className="px-4 py-2 bg-white border border-slate-200 text-gray-700 font-semibold rounded-lg cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
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
                              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-655 transition-all"
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
                    <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-500 ${isRecording ? 'animate-pulse scale-110 ring-4 ring-red-500/30' : ''}`}>
                      {isRecording ? (
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-12 h-12 bg-red-500 rounded-full animate-ping"></div>
                          <span className="w-6 h-6 bg-red-600 rounded-full z-10"></span>
                        </div>
                      ) : (
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {isRecording ? 'Listening to your voice...' : 'Voice Input'}
                    </h4>
                    <p className="text-gray-600 mb-6">
                      {isRecording ? 'Speak clearly. Your words will be transcribed when you click stop.' : 'Click the button below to start transcribing your speech'}
                    </p>
                    <button
                      onClick={toggleRecording}
                      className={`px-8 py-4 text-white font-black rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto ${
                        isRecording 
                          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 hover:shadow-red-650/40 border border-red-700'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isRecording ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        )}
                      </svg>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Quiz Settings
              </h3>

              {/* Topic Focus */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Topic Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis, databases..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-sm text-slate-900"
                />
              </div>

              {/* Difficulty Level */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">Difficulty Level</label>
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
                          : 'bg-slate-100 text-slate-655 hover:bg-slate-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">Number of Questions</label>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  placeholder="Enter number (max 100)"
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-center text-lg"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">Maximum 100 questions</p>
                {(numQuestions && parseInt(numQuestions) > 100) && (
                  <p className="text-xs text-red-650 mt-2 text-center font-semibold">⚠️ Maximum 100 questions allowed!</p>
                )}
              </div>

              {/* Time Per Question */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">Time Per Question</label>
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
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-202'
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {(customTime && parseInt(customTime) > 300) && (
                  <p className="text-xs text-red-655 font-semibold mt-2">⚠️ Maximum time is 5 minutes (300 seconds)</p>
                )}
              </div>

              {/* Generate Button */}
              {!quizReady && (
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || !topic || topic.trim().length < 2 || (activeTab === 'text' && !textInput.trim()) || ((activeTab === 'pdf' || activeTab === 'image') && !uploadedFile)}
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

      <style>{`
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

export default SoloMode;