import io from 'socket.io-client';

// Connects to our backend Node.js server.
// autoConnect is set to false so we explicitly control when the socket connects and disconnects.
const socket = io('http://localhost:5000', {
  autoConnect: false
});

export default socket;
