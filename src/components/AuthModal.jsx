import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Try real Supabase signup first if available
        let signUpError = null;
        let data = null;

        try {
          const res = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name }
            }
          });
          data = res.data;
          signUpError = res.error;

          if (!signUpError && data?.user) {
            const userSession = {
              name: name || email.split('@')[0],
              email: data.user.email || email,
              isLoggedIn: true
            };
            localStorage.setItem('quizmaster_user', JSON.stringify(userSession));
            onLoginSuccess(userSession);
            onClose();
            return;
          }
        } catch (err) {
          // Fall through to local auth if anon key is invalid/unconfigured
          if (!err.message?.includes('Invalid API key') && !err.message?.includes('dummy')) {
            throw err;
          }
        }

        if (signUpError && !signUpError.message?.includes('Invalid API key') && !signUpError.message?.includes('dummy')) {
          throw signUpError;
        }

        // 2. Local Database Signup Fallback
        const localUsers = JSON.parse(localStorage.getItem('quizmaster_local_users') || '[]');
        const userExists = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (userExists) {
          throw new Error('An account with this email address already exists. Please log in instead.');
        }

        // Save new user locally
        const newLocalUser = { name, email: email.toLowerCase(), password };
        localUsers.push(newLocalUser);
        localStorage.setItem('quizmaster_local_users', JSON.stringify(localUsers));

        const userSession = {
          name,
          email: email.toLowerCase(),
          isLoggedIn: true
        };
        localStorage.setItem('quizmaster_user', JSON.stringify(userSession));
        onLoginSuccess(userSession);
        onClose();
      } else {
        // Log In flow
        let signInError = null;
        let data = null;

        try {
          const res = await supabase.auth.signInWithPassword({
            email,
            password
          });
          data = res.data;
          signInError = res.error;

          if (!signInError && data?.user) {
            const userSession = {
              name: data.user.user_metadata?.name || email.split('@')[0],
              email: data.user.email || email,
              isLoggedIn: true
            };
            localStorage.setItem('quizmaster_user', JSON.stringify(userSession));
            onLoginSuccess(userSession);
            onClose();
            return;
          }
        } catch (err) {
          // Fall through to local auth if anon key is invalid/unconfigured
          if (!err.message?.includes('Invalid API key') && !err.message?.includes('dummy')) {
            throw err;
          }
        }

        if (signInError && !signInError.message?.includes('Invalid API key') && !signInError.message?.includes('dummy')) {
          throw signInError;
        }

        // Local Database Login Fallback
        const localUsers = JSON.parse(localStorage.getItem('quizmaster_local_users') || '[]');
        const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          throw new Error('No account found with this email address. Please sign up first.');
        }

        if (user.password !== password) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }

        const userSession = {
          name: user.name || email.split('@')[0],
          email: user.email,
          isLoggedIn: true
        };
        localStorage.setItem('quizmaster_user', JSON.stringify(userSession));
        onLoginSuccess(userSession);
        onClose();
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setError('');
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oAuthError) throw oAuthError;
    } catch (err) {
      console.error(`${provider} OAuth error:`, err);
      setError(`Failed to initiate ${provider} OAuth sign in.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 overflow-hidden">
        {/* Subtle Decorative Gradient Orb */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-3 text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {isSignUp ? 'Sign up with email or OAuth to track your progress' : 'Sign in to access your quizzes and stats'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-sm hover:shadow transition-all text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            or with email
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium text-center border border-red-100 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-slate-500 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
