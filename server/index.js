import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFileWatcher } from './fileWatcher.js';
import { initSocket } from './socket.js';
import imagesRoutes from './routes/images.js';
import feedbackRoutes from './routes/feedback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for public assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', imagesRoutes);
app.use('/api', feedbackRoutes);

// Socket.IO initialization
initSocket(io);

// File watcher initialization
initFileWatcher(io);

// SPA fallback - serve React from client/dist if built
const clientDistPath = path.join(path.dirname(__dirname), 'client', 'dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

const PORT = process.env.PORT || 3000;

const server = httpServer.listen(PORT, () => {
  console.log(`✅ ComfyUI Dashboard Server running on http://localhost:${PORT}`);
  console.log(`📊 File watching: ~/.openclaw/cache/comfyui-outputs/`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/socket.io`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };
