import React from "react";
import FeatureCard from "../components/FeatureCard";

function Home() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Multiple Choice",
      description: "Engaging question formats designed to test your knowledge effectively with clear options and instant feedback.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Feedback",
      description: "Get immediate results and detailed explanations for each question to enhance your learning experience.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Track Progress",
      description: "Monitor your improvement over time with detailed analytics and performance tracking metrics.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time, share quizzes, and collaborate on creating the perfect assessment.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Vector Search",
      description: "Advanced semantic search capabilities to find relevant questions and content using AI-powered vector embeddings.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Powered Generation",
      description: "Leverage cutting-edge AI to automatically generate high-quality questions tailored to your specific topics and difficulty levels.",
    }
  ];

  return (
    <>
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        {/* Animated Dot Pattern Background */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 2px, transparent 2px)`,
          backgroundSize: '50px 50px',
          animation: 'moveDots 20s linear infinite'
        }}></div>

        {/* Elegant Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-300/40 to-purple-300/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-indigo-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Clean Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:rotate-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                QuizMaster
              </span>
            </div>

            <button className="group px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300">
              <span className="flex items-center gap-2">
                Get Started
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-10">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/70 backdrop-blur-md rounded-full border border-indigo-200/50 shadow-lg shadow-indigo-500/10 animate-fade-in">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Learning Platform
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4 animate-fade-in" style={{animationDelay: '0.1s'}}>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                <span className="block text-gray-900">Master Any Topic</span>
                <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  With Smart Quizzes
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in" style={{animationDelay: '0.2s'}}>
              Transform your learning journey with AI-powered MCQs. Track progress, 
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold"> collaborate with peers</span>, and achieve mastery through intelligent assessments.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <button className="group relative px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/60 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center gap-3">
                  Start Learning Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>

              <button className="group px-10 py-5 bg-white/80 backdrop-blur-md text-gray-900 text-lg font-bold rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl hover:bg-white transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes moveDots {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>

      {/* FEATURES SECTION */}
      <section id="features" className="relative bg-[#E8EDF2] py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                            linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block text-xs font-bold text-purple-600 uppercase tracking-[0.2em] mb-6">
              Features
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to create, take, and excel at quizzes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;