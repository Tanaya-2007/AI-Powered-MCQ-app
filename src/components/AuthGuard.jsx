import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Production-only route guard. Fail-closed like the backend.
 * Source of truth is ALWAYS the live Supabase session.
 * localStorage 'quizmaster_user' is a UI mirror only, never proof.
 * No dummy-key bypass, no local-users fallback.
 */
export default function AuthGuard({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('loading'); // loading | authed | guest

  useEffect(() => {
    let mounted = true;

    const clearStaleMirror = () => {
      try {
        localStorage.removeItem('quizmaster_user');
      } catch {
        // storage blocked — ignore, session check already failed
      }
    };

    const check = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          clearStaleMirror();
          setStatus('guest');
          return;
        }

        const supabaseUser = data?.session?.user;
        if (!supabaseUser) {
          clearStaleMirror();
          setStatus('guest');
          return;
        }

        try {
          localStorage.setItem(
            'quizmaster_user',
            JSON.stringify({
              name:
                supabaseUser.user_metadata?.name ||
                supabaseUser.email?.split('@')[0] ||
                'User',
              email: supabaseUser.email,
              isLoggedIn: true,
              provider: 'supabase',
              id: supabaseUser.id,
            })
          );
        } catch {
          // storage full/blocked — auth still valid via Supabase session
        }
        setStatus('authed');
      } catch {
        if (!mounted) return;
        clearStaleMirror();
        setStatus('guest');
      }
    };

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const u = session.user;
        try {
          localStorage.setItem(
            'quizmaster_user',
            JSON.stringify({
              name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
              email: u.email,
              isLoggedIn: true,
              provider: 'supabase',
              id: u.id,
            })
          );
        } catch {
          // ignore
        }
        setStatus('authed');
      } else {
        clearStaleMirror();
        setStatus('guest');
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          <p className="text-sm font-semibold text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/?requireAuth=true" state={{ from: location }} replace />;
  }

  return children;
}
