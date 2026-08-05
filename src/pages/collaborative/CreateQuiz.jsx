import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function CreateQuiz() {
  const navigate = useNavigate();
  
  // States
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [topic, setTopic] = useState(''); // Topic Focus (just like Solo mode)
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [customTime, setCustomTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [quizCode, setQuizCode] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

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
    } else {
      // Switch active tab to text so they can see the transcription in real time
      setActiveTab('text');
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const generateQuizCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
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
    // Validate topic focus
    if (!topic || topic.trim() === '') {
      triggerAlert('Please enter a topic focus (e.g. Photosynthesis, databases)', 'warning');
      return;
    }
    if (topic.trim().length < 2) {
      triggerAlert('Topic focus must be at least 2 characters long!', 'warning');
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
  
    const time = customTime ? parseInt(customTime) : timePerQuestion;
    if (time === 0) {
      triggerAlert('Please enter time per question', 'warning');
      return;
    }
    if (time > 300) {
      triggerAlert('Time cannot exceed 5 minutes (300 seconds)! Please reduce the time.', 'warning');
      return;
    }
  
    if (activeTab === 'text' && !textInput.trim()) {
      triggerAlert('Please paste or write your text content first.', 'warning');
      return;
    }
    if (activeTab === 'file' && !uploadedFile) {
      triggerAlert('Please upload a study material file (PDF/Image) first.', 'warning');
      return;
    }
  
    setIsGenerating(true);
    let materialId = null;
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : (import.meta.env.VITE_BACKEND_URL || 'https://ai-powered-mcq-app.onrender.com');

    // Helper for resilient backend fetches (automatically switches to cloud backend if localhost:5000 is offline)
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
            continue; // retry immediately
          }
          if (i === retries - 1) throw err;
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      return fetch(currentUrl, options);
    };

    try {
      // 1. Ingest text or file into vector database with relevance check
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

      // 2. Generate actual questions based on topic and ingested document context
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
      if (genData.success && genData.quiz?.questions) {
        const parsedQuestions = genData.quiz.questions.map((q, idx) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        }));
        
        setQuizCode(generateQuizCode());
        setGeneratedQuestions(parsedQuestions);
        setQuizReady(true);
      } else {
        triggerAlert(`Generation failed: ${genData.message || 'Unable to generate questions matching the topic.'}`, 'error');
      }
    } catch (error) {
      console.error('Failed to communicate with backend API:', error);
      triggerAlert('The server is spinning up. Please click "Generate Quiz" again in 5 seconds!', 'warning');
    } finally {
      setIsGenerating(false);
    }
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
    setShowPreview(true);
    showToastMessage('Question updated successfully!');
  };

  const handleDeleteQuestion = (index) => {
    setQuestionToDelete(index);
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteQuestion = () => {
    if (questionToDelete !== null) {
      const updated = generatedQuestions.filter((_, i) => i !== questionToDelete);
      setGeneratedQuestions(updated);
      setNumQuestions(updated.length.toString());
      showToastMessage('Question deleted successfully!');
    }
    setShowDeleteConfirm(false);
    setQuestionToDelete(null);
  };
  
  const cancelDeleteQuestion = () => {
    setShowDeleteConfirm(false);
    setQuestionToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden animate-page-enter">

      {/* Custom Theme Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 animate-scale-in border border-slate-200 text-center relative">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
              {customAlert.type === 'error' && (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-655 flex items-center justify-center">
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
            
            <p className="text-gray-600 text-sm mb-6 whitespace-pre-line leading-relaxed">
              {customAlert.message}
            </p>

            <button
              onClick={() => setCustomAlert(null)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-650 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Quiz Ready popup */}
      {quizReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in overflow-y-auto py-8">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-200">
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

            {!showPreview && !showEdit ? (
              <>
                {/* Success header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl animate-bounce-once">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Quiz Created Successfully! 🎉</h3>
                  <p className="text-sm text-gray-600">{generatedQuestions.length} questions generated and ready</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Quiz Code & Settings */}
                  <div className="space-y-4">
                    {/* Quiz Code Card */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-center shadow-lg">
                      <p className="text-white/80 text-xs font-semibold mb-1">Quiz Code</p>
                      <div className="text-4xl font-black text-white tracking-wider mb-2">
                        {quizCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(quizCode);
                          showToastMessage('Code copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-lg backdrop-blur-sm transition-all"
                      >
                        📋 Copy Code
                      </button>
                    </div>

                    {/* Quiz Settings Card */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                      <h4 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Quiz Settings
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Topic</span>
                          <span className="text-gray-900 font-bold">{topic}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Questions</span>
                          <span className="text-gray-900 font-bold">{generatedQuestions.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Time/Question</span>
                          <span className="text-gray-900 font-bold">{customTime || timePerQuestion}s</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Difficulty</span>
                          <span className="text-gray-900 font-bold capitalize">{difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Preview Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h4 className="text-base font-black text-gray-900">Review & Customize Questions</h4>
                      </div>
                      
                      <button
                        onClick={() => setShowPreview(true)}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview & Edit All Questions
                      </button>
                      <p className="text-xs text-center text-gray-600">
                        Review, edit, or delete questions before starting
                      </p>
                    </div>

                    {/* Action Buttons*/}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 space-y-2">
                      <button
                        onClick={() => navigate('/collab/quiz-lobby', { 
                          state: { 
                            quizCode, 
                            difficulty, 
                            numQuestions: generatedQuestions.length, 
                            timePerQuestion: customTime || timePerQuestion,
                            questions: generatedQuestions,
                            title: topic
                          } 
                        })}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-base font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
                        className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        📤 Share Link
                      </button>
                    </div>
                  </div>
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
                questionNumber={editingQuestionIndex + 1}
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
              onClick={() => navigate('/collaborative')}
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

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        
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
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-205 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                  Upload Study Material
                </h3>
                
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
                          : 'bg-white text-gray-600 hover:bg-gray-55 border border-slate-205'
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

              <div className="p-6">
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste your text content here... (lecture notes, book chapters, articles, etc.)"
                      rows="12"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-gray-900 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all duration-300"
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
                              <p className="font-bold text-gray-900">{uploadedFile.name}</p>
                              <p className="text-sm text-gray-605">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <label className="px-4 py-2 bg-white border border-slate-202 text-gray-700 font-semibold rounded-lg cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
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
                    <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-500 ${isRecording ? 'animate-pulse scale-110 ring-4 ring-red-500/30' : ''}`}>
                      {isRecording ? (
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-12 h-12 bg-red-500 rounded-full animate-ping"></div>
                          <span className="w-6 h-6 bg-red-655 rounded-full z-10"></span>
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
                      {isRecording ? 'Speak clearly. Your words will be transcribed in the text area.' : 'Click the button below to start transcribing your speech'}
                    </p>
                    <button
                      onClick={toggleRecording}
                      className={`px-8 py-4 text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto ${
                        isRecording 
                          ? 'bg-gradient-to-r from-red-500 to-pink-655 hover:shadow-red-500/30'
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
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Quiz Settings
              </h3>

              {/* Topic Focus */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-750 mb-2">Topic Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis, databases..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-202 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-sm text-slate-905"
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
                          : 'bg-slate-105 text-slate-655 hover:bg-slate-200'
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
                <p className="text-xs text-gray-550 mt-2 text-center">Maximum 100 questions</p>
                {(numQuestions && parseInt(numQuestions) > 100) && (
                  <p className="text-xs text-red-600 mt-2 text-center font-semibold">⚠️ Maximum 100 questions allowed!</p>
                )}
              </div>

              {/* Time Per Question */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-750 mb-3">Time Per Question</label>
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
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-205'
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
      
      {/* Delete Confirmation Popup  */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform scale-100 animate-scale-in border border-slate-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Question?</h3>
              <p className="text-gray-655 text-sm">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
            </div>

            {/* Question Preview */}
            {questionToDelete !== null && generatedQuestions[questionToDelete] && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-black text-sm">Q{questionToDelete + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-905 line-clamp-2">
                    {generatedQuestions[questionToDelete].question}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={cancelDeleteQuestion}
                className="py-3 bg-gray-105 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuestion}
                className="py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 px-6 py-4 flex items-center gap-3 min-w-[320px]">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-650 to-purple-650 rounded-l-2xl"></div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

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

// Question Preview Subcomponent
function QuestionPreview({ questions, onEdit, onDelete, onBack }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-4 border-b-2 border-gray-200">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900">
          Review Questions ({questions.length})
        </h3>
        <button 
          onClick={onBack} 
          className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 text-gray-700 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 sm:space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-indigo-300 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 sm:gap-3 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm sm:text-base">Q{index + 1}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">{q.question}</h4>
              </div>
              
              <div className="flex gap-2 sm:flex-shrink-0">
                <button
                  onClick={() => onEdit(index)}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-200 transition-all flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => onDelete(index)}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-200 transition-all flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-2.5 sm:p-3 rounded-lg border-2 text-xs sm:text-sm font-medium ${
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

// Question Editor Subcomponent
function QuestionEditor({ question, onSave, onCancel }) {
  const [editedQuestion, setEditedQuestion] = useState({ ...question });
  
  const hasChanges = 
    question.question !== editedQuestion.question ||
    question.correctAnswer !== editedQuestion.correctAnswer ||
    question.options.some((opt, i) => opt !== editedQuestion.options[i]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-4 border-b-2 border-gray-200">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900">Edit Question</h3>
        <button 
          onClick={onCancel} 
          className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 text-gray-700 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Preview
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Question</label>
          <textarea
            value={editedQuestion.question}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
            rows="3"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base resize-none"
            placeholder="Enter your question here..."
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">Options</label>
          {editedQuestion.options.map((opt, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...editedQuestion.options];
                  newOptions[i] = e.target.value;
                  setEditedQuestion({ ...editedQuestion, options: newOptions });
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
              
              <label className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all">
                <input
                  type="radio"
                  name="correct"
                  checked={editedQuestion.correctAnswer === i}
                  onChange={() => setEditedQuestion({ ...editedQuestion, correctAnswer: i })}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Correct</span>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSave(editedQuestion)}
          disabled={!hasChanges}
          className={`w-full py-3 sm:py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            hasChanges
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl cursor-pointer'
              : 'bg-gray-300 text-gray-555 cursor-not-allowed opacity-60'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {hasChanges ? 'Save Changes' : 'No Changes to Save'}
        </button>
        
        {!hasChanges && (
          <p className="text-center text-sm text-gray-500 -mt-2">
            Make changes to enable the save button
          </p>
        )}
      </div>
    </div>
  );
}

export default CreateQuiz;