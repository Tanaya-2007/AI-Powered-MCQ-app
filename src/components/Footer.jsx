import React, { useState } from "react";

function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log({ email, message });
    setEmail("");
    setMessage("");
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 border-t border-gray-200 overflow-hidden">
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.12) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>

      {/* Subtle Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Brand & Info */}
          <div className="space-y-8">
            {/* Logo & Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  QuizMaster
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed max-w-md">
                AI-powered MCQ generation platform designed to transform your learning journey through intelligent assessments and real-time collaboration.
              </p>
            </div>

            {/* Quick Links - WITH GRADIENT BAR */}
            <div>
              <h4 className="text-gray-900 font-bold mb-4 text-lg flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Quick Links
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-sm font-medium">
                  Features
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-sm font-medium">
                  Pricing
                </a>
                <a href="#about" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-sm font-medium">
                  About Us
                </a>
                <a href="#blog" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 text-sm font-medium">
                  Blog
                </a>
              </div>
            </div>

            {/* Social Links - WITH GRADIENT BAR */}
            <div>
              <h4 className="text-gray-900 font-bold mb-4 text-lg flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Connect With Us
              </h4>
              <div className="flex gap-3">
                <a
                  href="https://github.com/Tanaya-2007"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg hover:shadow-indigo-500/30 transform hover:scale-110 transition-all duration-300"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/tanaya-pawar-2b04892b8?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                  className="w-11 h-11 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg hover:shadow-indigo-500/30 transform hover:scale-110 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-gray-900 font-bold text-2xl flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                Get in Touch
              </h4>
              <p className="text-gray-600 text-sm">Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            </div>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-md hover:shadow-lg transition-all duration-300"
                />
              </div>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows="5"
                  required
                  className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none shadow-md hover:shadow-lg transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="group w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/60 transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  Send Message
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar - Copyright */}
        <div className="border-t-2 border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm font-medium">
              © {new Date().getFullYear()} QuizMaster. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#privacy" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium">
                Terms of Service
              </a>
              <a href="#cookies" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;