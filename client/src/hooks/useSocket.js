import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useSocket(url, onEvent) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    });

    newSocket.on('image:new', (data) => onEvent('image:new', data));
    newSocket.on('image:updated', (data) => onEvent('image:updated', data));
    newSocket.on('feedback:saved', (data) => onEvent('feedback:saved', data));
    newSocket.on('stats:updated', (data) => onEvent('stats:updated', data));
    newSocket.on('image:removed', (data) => onEvent('image:removed', data));

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [url, onEvent]);

  return { socket, connected };
}
