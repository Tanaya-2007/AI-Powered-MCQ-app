import io from 'socket.io-client';
import { supabase } from './supabaseClient';

// Use production Render backend URL when deployed, or localhost during dev override
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001'
  : (import.meta.env.VITE_BACKEND_URL || 'https://ai-powered-mcq-app.onrender.com');

const socket = io(BACKEND_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'], // Prioritize direct WebSockets to prevent polling connection errors
  reconnection: true,
  reconnectionAttempts: 6,              // Prevent infinite unthrottled loop
  reconnectionDelay: 2000,              // 2s backoff
  reconnectionDelayMax: 10000,
  timeout: 10000                        // 10s timeout
});

// Suppress unhandled socket connect errors to keep console clean
socket.on('connect_error', (err) => {
  // Debug log only, prevents red unhandled exceptions
  if (import.meta.env?.DEV) {
    console.debug('[Socket] Connection status:', err?.message || 'Server waking up');
  }
});

// Attach Supabase JWT to handshake so backend can verify hosts.
async function refreshSocketAuth() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    socket.auth = token ? { token } : {};
  } catch {
    socket.auth = {};
  }
}

const rawConnect = socket.connect.bind(socket);
socket.connect = (...args) => {
  refreshSocketAuth()
    .then(() => rawConnect(...args))
    .catch(() => rawConnect(...args));
  return socket;
};

// Keep auth fresh on login/logout/token refresh
try {
  supabase.auth.onAuthStateChange((_event, session) => {
    const token = session?.access_token;
    socket.auth = token ? { token } : {};
  });
  refreshSocketAuth();
} catch {
  // Supabase unconfigured
}

export default socket;
