import io from 'socket.io-client';

// Use production Render backend URL when deployed, or localhost during dev override
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001'
  : (import.meta.env.VITE_BACKEND_URL || 'https://ai-powered-mcq-app.onrender.com');

const socket = io(BACKEND_URL, {
  autoConnect: false
});

export default socket;
