import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

function ModeSelection() {
  const [hoveredMode, setHoveredMode] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 overflow-hidden animate-page-enter">
      {/* ANIMATED DOT PATTERN BACKGROUND */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.2) 2px, transparent 2px)`,
          backgroundSize: '50px 50px',
          animation: 'moveDots 20s linear infinite'
        }}
      ></div>

      {/* Elegant Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-300/40 to-purple-300/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-indigo-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-30 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:rotate-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              QuizMaster
            </span>
          </div>

          <button 
          onClick={() => navigate('/')}
          className="group px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-md text-gray-900 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl hover:bg-white transform hover:scale-105 transition-all duration-300">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl w-full space-y-8 sm:space-y-12">
          
          {/* Header Section */}
          <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-full border border-indigo-300/30 shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 animate-spin-slow" style={{animationDuration: '3s'}} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
              </svg>
              <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative z-10">
                Choose Your Learning Journey
              </span>
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
            </div>

            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                <span className="block text-gray-900">Select Your</span>
                <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Learning Mode
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Whether you prefer to learn independently or collaborate with peers, we've got the perfect mode for you.
            </p>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
            
            {/* SOLO MODE CARD */}
            <div 
              className="group relative"
              onMouseEnter={() => setHoveredMode('solo')}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <div className="relative h-full bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{
                  boxShadow: hoveredMode === 'solo' 
                    ? '0 25px 50px -12px rgba(99, 102, 241, 0.25), 0 0 0 3px rgba(99, 102, 241, 0.1)'
                    : '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Gradient Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full space-y-6">
                  {/* Icon */}
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:shadow-2xl group-hover:shadow-indigo-500/50 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold rounded-full">
                      Popular
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3 flex-1">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      Solo Mode
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Master topics at your own pace. Perfect for focused, independent learning with personalized quiz generation and progress tracking.
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    {[
                      'Personal progress tracking',
                      'AI-generated custom quizzes',
                      'Instant feedback & explanations',
                      'Flexible learning schedule'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm sm:text-base text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button 
                    onClick={() => navigate('/solo-mode')}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-indigo-500/30"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start Solo Mode
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* COLLABORATIVE MODE CARD */}
            <div 
              className="group relative"
              onMouseEnter={() => setHoveredMode('collab')}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <div className="relative h-full bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                style={{
                  boxShadow: hoveredMode === 'collab' 
                    ? '0 25px 50px -12px rgba(168, 85, 247, 0.25), 0 0 0 3px rgba(168, 85, 247, 0.1)'
                    : '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Gradient Corner Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full space-y-6">
                  {/* Icon */}
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/30 group-hover:shadow-2xl group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs sm:text-sm font-bold rounded-full">
                      Team Play
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3 flex-1">
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      Collaborative Mode
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Learn together with friends and classmates. Share quizzes, compete on leaderboards, and grow as a team.
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    {[
                      'Real-time team collaboration',
                      'Shared quiz creation & solving',
                      'Competitive leaderboards',
                      'Group progress analytics'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm sm:text-base text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button 
                  onClick={() => navigate('/collaborative')}
                  className="w-full py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/60 transform hover:scale-105 transition-all duration-300 group/btn">
                    <span className="flex items-center justify-center gap-2">
                      Start Collaborative Mode
                      <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Help Text */}
          <div className="text-center space-y-3 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <p className="text-sm sm:text-base text-gray-500">
              Not sure which mode to choose? You can always switch later!
            </p>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes moveDots {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default ModeSelection;