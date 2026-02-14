import { getStats } from './feedbackHandler.js';

let statsInterval = null;

export function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send initial stats on connection
    getStats().then((stats) => {
      socket.emit('stats:updated', stats);
    }).catch((err) => {
      console.error('Error getting initial stats:', err);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Emit stats every 5 seconds to all connected clients
  if (statsInterval) {
    clearInterval(statsInterval);
  }

  statsInterval = setInterval(async () => {
    try {
      const stats = await getStats();
      io.emit('stats:updated', stats);
    } catch (err) {
      console.error('Error broadcasting stats:', err);
    }
  }, 5000);

  console.log('✨ Socket.IO initialized');
  console.log('📡 Events: image:new, image:updated, image:removed, feedback:saved, stats:updated');
}

// Function to emit events from other modules
export function emitEvent(io, event, data) {
  io.emit(event, data);
  console.log(`📡 Emitted: ${event}`, data);
}

// Graceful shutdown helper
export function closeSocket(io) {
  if (statsInterval) {
    clearInterval(statsInterval);
  }
  io.close();
}
