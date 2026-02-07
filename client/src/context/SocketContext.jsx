import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (user) {
      const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Initialize socket connection
      const newSocket = io(SERVER_URL, {
        withCredentials: true
      });

      // Identify user to server
      newSocket.emit('identify', user.id);

      // Listen for booking confirmation notifications
      newSocket.on('booking-confirmed', (data) => {
        toast.success(
          `${data.message}\nEvent: ${data.eventTitle}\nReference: ${data.bookingReference}`,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        );
      });

      // Handle connection errors
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      // Disconnect socket when user logs out
      setSocket(null);
    }
  }, [user]);

  const value = {
    socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
