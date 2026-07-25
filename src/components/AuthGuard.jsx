import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route guard component to restrict access to authenticated users only.
 * Redirects unauthenticated users to the Home page and triggers the login prompt.
 */
export default function AuthGuard({ children }) {
  const savedUser = localStorage.getItem('quizmaster_user');
  const location = useLocation();

  if (!savedUser) {
    return <Navigate to="/?requireAuth=true" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    if (!user || !user.isLoggedIn) {
      return <Navigate to="/?requireAuth=true" state={{ from: location }} replace />;
    }
  } catch (e) {
    return <Navigate to="/?requireAuth=true" state={{ from: location }} replace />;
  }

  return children;
}
