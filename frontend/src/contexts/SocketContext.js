import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Socket 연결 생성
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          userId: user._id,
        },
        transports: ['websocket', 'polling'],
      });

      // 연결 이벤트 리스너
      newSocket.on('connect', () => {
        console.log('Socket 연결됨:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket 연결 해제됨');
        setIsConnected(false);
      });

      // 알림 이벤트 리스너
      newSocket.on('notification', (notification) => {
        console.log('새 알림:', notification);
        setNotifications(prev => [notification, ...prev]);
        
        // 토스트 알림 표시
        toast.info(notification.message, {
          onClick: () => handleNotificationClick(notification),
        });
      });

      // 예약 상태 업데이트
      newSocket.on('booking-update', (data) => {
        console.log('예약 업데이트:', data);
        toast.info(`예약이 ${data.status}되었습니다`);
      });

      // 상담사 온라인 상태 업데이트
      newSocket.on('counselor-status', (data) => {
        console.log('상담사 상태 업데이트:', data);
        // 상담사 목록 페이지에서 실시간 상태 업데이트
        window.dispatchEvent(new CustomEvent('counselor-status-update', { detail: data }));
      });

      // 채팅 메시지
      newSocket.on('chat-message', (message) => {
        console.log('새 채팅 메시지:', message);
        window.dispatchEvent(new CustomEvent('new-chat-message', { detail: message }));
      });

      // 화상 통화 이벤트들
      newSocket.on('video-offer', (data) => {
        window.dispatchEvent(new CustomEvent('video-offer', { detail: data }));
      });

      newSocket.on('video-answer', (data) => {
        window.dispatchEvent(new CustomEvent('video-answer', { detail: data }));
      });

      newSocket.on('ice-candidate', (data) => {
        window.dispatchEvent(new CustomEvent('ice-candidate', { detail: data }));
      });

      setSocket(newSocket);

      // 정리 함수
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification) => {
    // 알림 타입에 따른 페이지 이동 로직
    switch (notification.type) {
      case 'booking_confirmed':
        window.location.href = '/dashboard';
        break;
      case 'session_reminder':
        window.location.href = `/session/${notification.sessionId}`;
        break;
      case 'message_received':
        window.location.href = `/session/${notification.sessionId}`;
        break;
      default:
        break;
    }
  };

  // 세션 참여
  const joinSession = (sessionId) => {
    if (socket) {
      socket.emit('join-session', sessionId);
      console.log('세션 참여:', sessionId);
    }
  };

  // 채팅 메시지 전송
  const sendChatMessage = (sessionId, message) => {
    if (socket) {
      const messageData = {
        sessionId,
        message,
        sender: user._id,
        senderName: user.name,
        timestamp: new Date().toISOString(),
      };
      socket.emit('chat-message', messageData);
      return messageData;
    }
  };

  // 화상 통화 Offer 전송
  const sendVideoOffer = (sessionId, offer) => {
    if (socket) {
      socket.emit('video-offer', {
        sessionId,
        offer,
        sender: user._id,
      });
    }
  };

  // 화상 통화 Answer 전송
  const sendVideoAnswer = (sessionId, answer) => {
    if (socket) {
      socket.emit('video-answer', {
        sessionId,
        answer,
        sender: user._id,
      });
    }
  };

  // ICE Candidate 전송
  const sendIceCandidate = (sessionId, candidate) => {
    if (socket) {
      socket.emit('ice-candidate', {
        sessionId,
        candidate,
        sender: user._id,
      });
    }
  };

  // 알림 읽음 처리
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const value = {
    socket,
    isConnected,
    notifications,
    joinSession,
    sendChatMessage,
    sendVideoOffer,
    sendVideoAnswer,
    sendIceCandidate,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};