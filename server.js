const express = require('express');
// const mongoose = require('mongoose'); // 사용하지 않음
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 필수 환경 변수 검증
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다:', missingEnvVars.join(', '));
  console.error('📝 .env 파일을 확인하거나 .env.example을 참고하세요.');
  process.exit(1);
}

// 유틸리티 import
const logger = require('./utils/logger');
const ApiResponse = require('./utils/response');
const database = require('./config/database');

// 모니터링 import
const {
  performanceMonitoring,
  memoryMonitoring,
  errorTracking,
  gracefulShutdown
} = require('./middleware/monitoring');

// 보안 미들웨어 import
const {
  generalLimiter,
  helmetConfig,
  sanitizeInput,
  preventInjection,
  corsOptions
} = require('./middleware/security');

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(cors(corsOptions));

// Rate limiting
app.use('/api', generalLimiter);

// Input sanitization and injection prevention
app.use(sanitizeInput);
app.use(preventInjection);

// Request logging middleware
app.use(logger.requestLogger());

// Performance monitoring
app.use(performanceMonitoring);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB 연결 초기화
database.connect().catch(err => {
  logger.error('데이터베이스 연결 실패로 서버를 종료합니다.', { error: err.message });
  process.exit(1);
});

// Health check routes (before rate limiting)
app.use('/health', require('./routes/health'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/counselors', require('./routes/counselors'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/upload', require('./routes/upload'));

// HTML 페이지 라우트 설정
const htmlRoutes = [
  { path: '/', file: 'index.html' },
  { path: '/login', file: 'login.html' },
  { path: '/signup', file: 'signup.html' },
  { path: '/client-register', file: 'client-register.html' },
  { path: '/counselor-register', file: 'counselor-register.html' },
  { path: '/counselors', file: 'counselors.html' },
  { path: '/booking', file: 'booking.html' },
  { path: '/client-dashboard', file: 'client-dashboard.html' },
  { path: '/counselor-dashboard', file: 'counselor-dashboard.html' },
  { path: '/session', file: 'session.html' },
  { path: '/admin', file: 'admin.html' },
  { path: '/test-login', file: 'test-login.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/payment', file: 'payment.html' },
  { path: '/video-test', file: 'video-test.html' }
];

// HTML 라우트 자동 등록
htmlRoutes.forEach(route => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', route.file));
  });
});

// Error handling middleware
app.use(errorTracking);

// 404 handler
app.use('*', (req, res) => {
  ApiResponse.notFoundError(res, '요청한 리소스를 찾을 수 없습니다.');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`, { port: PORT, env: process.env.NODE_ENV });

  // 모니터링 시작
  memoryMonitoring();
  gracefulShutdown();
});

// Socket.IO for real-time communication
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('사용자 연결', { socketId: socket.id });

  // Join session room
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    logger.info('세션 참여', { sessionId, socketId: socket.id });
  });

  // Handle video call events
  socket.on('video-offer', (data) => {
    socket.to(data.sessionId).emit('video-offer', data);
    logger.debug('Video offer 전송', { sessionId: data.sessionId });
  });

  socket.on('video-answer', (data) => {
    socket.to(data.sessionId).emit('video-answer', data);
    logger.debug('Video answer 전송', { sessionId: data.sessionId });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.sessionId).emit('ice-candidate', data);
    logger.debug('ICE candidate 전송', { sessionId: data.sessionId });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    socket.to(data.sessionId).emit('chat-message', data);
    logger.debug('채팅 메시지 전송', { sessionId: data.sessionId });
  });

  socket.on('disconnect', () => {
    logger.info('사용자 연결 해제', { socketId: socket.id });
  });
});

module.exports = app;
