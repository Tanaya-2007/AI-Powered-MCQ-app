import React from "react";
// import homebg from "../assets/homebg.jpg";
import FeatureCard from "../components/FeatureCard";
// import Logo from "../components/Logo";

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
          <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Vibrant Gradient Orbs */}
          <div className="absolute top-20 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-fuchsia-500/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Floating Question Marks with Glow */}
          <div className="absolute top-1/4 left-1/4 text-6xl font-bold text-cyan-300/60 animate-float drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{animationDelay: '0s'}}>?</div>
          <div className="absolute top-1/3 right-1/4 text-5xl font-bold text-purple-300/60 animate-float drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" style={{animationDelay: '1s'}}>?</div>
          <div className="absolute bottom-1/4 left-1/3 text-7xl font-bold text-pink-300/60 animate-float drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" style={{animationDelay: '2s'}}>?</div>
          
          {/* Animated Grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                              linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
          
          {/* Sparkles */}
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-cyan-300 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-pink-300 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        </div>

        {/* Navigation Bar */}
        <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-xl group-hover:shadow-purple-500/70 transition-all duration-300 group-hover:scale-110">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                QuizMaster
              </span>
            </div>

            {/* Sign Up Button */}
            <button className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-2xl hover:shadow-purple-500/60 transform hover:scale-105 transition-all duration-300 overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Get Started
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-20">
          <div className="text-center space-y-8">


            {/* Main Heading */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-tight animate-fade-in">
              <span className="block text-white drop-shadow-2xl">Master Any Topic</span>
              <span className="block mt-2 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-2xl">
                With Smart Quizzes
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed animate-fade-in drop-shadow-lg" style={{animationDelay: '0.2s'}}>
              Transform your learning journey with AI-powered MCQs. Track progress, collaborate with peers, and achieve mastery through intelligent assessments.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <button className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-lg font-bold rounded-2xl hover:shadow-2xl hover:shadow-purple-500/70 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  Start Learning Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <button className="group px-10 py-5 bg-white/10 backdrop-blur-md text-white text-lg font-bold rounded-2xl hover:bg-white/20 hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20 flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Exciting Features */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-16 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <div className="group flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">Instant Results</div>
                  <div className="text-cyan-200 text-xs">Real-time feedback</div>
                </div>
              </div>

              <div className="group flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">AI Generated</div>
                  <div className="text-purple-200 text-xs">Smart questions</div>
                </div>
              </div>

              <div className="group flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">Collaborate</div>
                  <div className="text-pink-200 text-xs">Learn together</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(60px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
   

           {/* Features Section */}
           <section id="features" className="relative bg-[#E8EDF2] py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                            linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
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

          {/* Feature Cards Grid */}
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
