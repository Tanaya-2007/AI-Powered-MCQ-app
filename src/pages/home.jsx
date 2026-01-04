import React from "react";
import homebg from "../assets/homebg.jpg";

function Home() {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${homebg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        // backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-50 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Welcome to
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
              AI Powered MCQ Quiz App
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Test your knowledge, challenge yourself, and learn something new with our interactive quiz platform
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50">
              <span className="relative z-10">Start Quiz</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white text-lg font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transform hover:scale-105 transition-all duration-300 shadow-lg">
              Learn More
            </button>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-16 border-t border-white/20">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-full">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Multiple Choice</h3>
              <p className="text-gray-300 text-sm">Engaging question formats</p>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-full">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Instant Feedback</h3>
              <p className="text-gray-300 text-sm">Get results immediately</p>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-full">
                <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Track Progress</h3>
              <p className="text-gray-300 text-sm">Monitor your improvement</p>
            </div>
          </div>
        </div>
      </div>
      
     
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
    </section>
  );
}

export default Home;
