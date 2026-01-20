import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CollabLanding() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

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

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full py-8 sm:py-12 px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/mode-selection')}
          className="group flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-all duration-300 mb-8"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-bold">Back</span>
        </button>

        {/* Header Section */}
        <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-full border border-indigo-300/30 shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choose Your Collaborative Journey
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              <span className="block text-gray-900">Select Your</span>
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Collaborative Mode
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Whether you want to host a quiz or join one, we've got the perfect mode for you.
          </p>
        </div>

        {/* Mode Cards - UNIQUE DESIGN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto mb-8">
          
          {/* CREATE QUIZ CARD - LEFT ALIGNED DESIGN */}
          <div 
            className="group relative"
            onMouseEnter={() => setHoveredCard('create')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div 
              className="relative h-full bg-gradient-to-br from-white to-indigo-50/30 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-3 overflow-hidden border-2 border-indigo-100"
              style={{
                boxShadow: hoveredCard === 'create' 
                  ? '0 30px 60px -12px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                  : '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
              }}
            >
             
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="relative z-10 h-full flex flex-col">
               
                <div className="flex items-start justify-between mb-6">
                  
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:shadow-indigo-500/60 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  
                  {/* Badge */}
                  <div className="px-4 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm font-black rounded-full shadow-lg">
                    HOST
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                    Create Quiz
                  </h3>
                  
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Generate a quiz and share with others. Perfect for teachers, trainers, and group leaders.
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold rounded-lg">
                      🎯 Live Sessions
                    </span>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold rounded-lg">
                      ⚡ Real-time Control
                    </span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold rounded-lg">
                    📊 Live Analytics
                    </span>
                    <span className="px-3 py-1.5 bg-pink-100 text-pink-700 text-xs sm:text-sm font-semibold rounded-lg">
                      🔗 Easy Sharing
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  onClick={() => navigate('/collab/create-quiz')}
                  className="mt-6 w-full py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2">
                    Start Creating
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div 
            className="group relative"
            onMouseEnter={() => setHoveredCard('attempt')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div 
              className="relative h-full bg-gradient-to-br from-white to-pink-50/30 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-3 overflow-hidden border-2 border-pink-100"
              style={{
                boxShadow: hoveredCard === 'attempt' 
                  ? '0 30px 60px -12px rgba(236, 72, 153, 0.3), 0 0 0 1px rgba(236, 72, 153, 0.1)'
                  : '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
              }}
            >
              
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
            
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="relative z-10 h-full flex flex-col">
               
                <div className="flex items-start justify-between mb-6">
                  
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-pink-500/40 group-hover:shadow-pink-500/60 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  
                 
                  <div className="px-4 py-1.5 bg-pink-600 text-white text-xs sm:text-sm font-black rounded-full shadow-lg">
                    JOIN
                  </div>
                </div>

               
                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                    Attempt Quiz
                  </h3>
                  
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Join a quiz using code or link. Perfect for students, participants, and learners.
                  </p>

                  {/* Featureas */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1.5 bg-pink-100 text-pink-700 text-xs sm:text-sm font-semibold rounded-lg">
                    ⚡ Instant Results
                    </span>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs sm:text-sm font-semibold rounded-lg">
                      ⚔️ Compete Live
                    </span>
                    <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs sm:text-sm font-semibold rounded-lg">
                      🏆 Rankings
                    </span>
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold rounded-lg">
                    👥 Team Mode
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  onClick={() => navigate('/collab/attempt-quiz')}
                  className="mt-6 w-full py-4 sm:py-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2">
                    Join Quiz
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

        </div>

        </div>
    </div>
  );
}

export default CollabLanding;