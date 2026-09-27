import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Production-grade route guard.
 * Source of truth is Supabase session (verified via supabase.auth.getSession),
 * NOT localStorage alone (previously spoofable via setItem).
 *
 * - If Supabase session exists -> sync localStorage mirror and allow.
 * - If Supabase is unconfigured (dummy/invalid anon key) -> fall back to
 *   localStorage check for local dev only.
 * - If Supabase is configured but no session -> redirect to login,
 *   even if localStorage says isLoggedIn (prevents spoofing).
 */
export default function AuthGuard({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('loading'); // loading | authed | guest

  useEffect(() => {
    let mounted = true;

    const isSupabaseMisconfigured = (err) => {
      const msg = err?.message || String(err || '');
      return msg.includes('Invalid API key') || msg.includes('dummy') || msg.includes('apikey');
    };

    const readLocalSession = () => {
      try {
        const raw = localStorage.getItem('quizmaster_user');
        if (!raw) return null;
        const user = JSON.parse(raw);
        if (user && user.isLoggedIn && user.email) return user;
        return null;
      } catch {
        return null;
      }
    };

    const check = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          // Supabase not configured -> allow local dev fallback
          if (isSupabaseMisconfigured(error)) {
            setStatus(readLocalSession() ? 'authed' : 'guest');
            return;
          }
          setStatus('guest');
          return;
        }

        const supabaseUser = data?.session?.user;
        if (supabaseUser) {
          // Sync mirror for UI (avatar/name) — never used as auth proof alone
          const userSession = {
            name:
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split('@')[0] ||
              'User',
            email: supabaseUser.email,
            isLoggedIn: true,
            provider: 'supabase',
            id: supabaseUser.id,
          };
          try {
            localStorage.setItem('quizmaster_user', JSON.stringify(userSession));
          } catch {
            // storage full/blocked — auth still valid via Supabase session
          }
          setStatus('authed');
          return;
        }

        // No Supabase session. Do NOT trust localStorage when Supabase is configured.
        // Exception: if anon key is still dummy, getSession succeeds with null session
        // but server is unusable — allow local fallback so dev without keys still works.
        const anonKey =
          import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-anon-key';
        if (anonKey === 'dummy-anon-key') {
          setStatus(readLocalSession() ? 'authed' : 'guest');
          return;
        }

        setStatus('guest');
      } catch (err) {
        if (!mounted) return;
        if (isSupabaseMisconfigured(err)) {
          setStatus(readLocalSession() ? 'authed' : 'guest');
          return;
        }
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
        // Signed out -> force re-check (will fall to guest when configured)
        check();
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
