const logger = require('../utils/logger');

/**
 * 성능 모니터링 미들웨어
 */

// 요청 성능 추적
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const startUsage = process.cpuUsage();

  // 응답 완료 시 성능 데이터 로깅
  res.on('finish', () => {
    const endTime = Date.now();
    const endUsage = process.cpuUsage(startUsage);
    const duration = endTime - startTime;

    const performanceData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userCpuTime: `${endUsage.user / 1000}ms`,
      systemCpuTime: `${endUsage.system / 1000}ms`,
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      timestamp: new Date().toISOString()
    };

    // 느린 요청 경고 (500ms 이상)
    if (duration > 500) {
      logger.warn('Slow request detected', performanceData);
    }

    // 에러 응답 로깅
    if (res.statusCode >= 400) {
      logger.error('Error response', performanceData);
    }

    // 일반 성능 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Request performance', performanceData);
    }
  });

  next();
};

// 메모리 사용량 모니터링
const memoryMonitoring = () => {
  const checkMemory = () => {
    const memoryUsage = process.memoryUsage();
    const memoryData = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString()
    };

    // 메모리 사용량이 높을 때 경고
    if (memoryData.heapUsed > 500) { // 500MB 이상
      logger.warn('High memory usage detected', memoryData);
    }

    // 메모리 누수 감지 (힙 사용량이 계속 증가하는 경우)
    if (!memoryMonitoring.previousHeapUsed) {
      memoryMonitoring.previousHeapUsed = memoryData.heapUsed;
    } else {
      const heapIncrease = memoryData.heapUsed - memoryMonitoring.previousHeapUsed;
      if (heapIncrease > 50) { // 50MB 이상 증가
        logger.warn('Potential memory leak detected', {
          ...memoryData,
          heapIncrease: `${heapIncrease}MB`
        });
      }
      memoryMonitoring.previousHeapUsed = memoryData.heapUsed;
    }

    // 개발 환경에서는 주기적으로 메모리 상태 로깅
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Memory usage', memoryData);
    }
  };

  // 5분마다 메모리 체크
  setInterval(checkMemory, 5 * 60 * 1000);

  // 초기 체크
  checkMemory();
};

// 에러 추적
const errorTracking = (err, req, res, _next) => {
  const errorData = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  };

  // 에러 유형별 분류
  if (err.name === 'ValidationError') {
    errorData.type = 'validation';
  } else if (err.name === 'CastError') {
    errorData.type = 'database';
  } else if (err.name === 'JsonWebTokenError') {
    errorData.type = 'authentication';
  } else {
    errorData.type = 'unknown';
  }

  logger.error('Application error', errorData);

  // 에러 응답
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? '서버 오류가 발생했습니다.'
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

// 시스템 메트릭 수집
const collectMetrics = () => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  };

  // 메트릭을 파일에 저장하거나 외부 모니터링 시스템으로 전송
  logger.info('System metrics', metrics);
};

// 프로세스 종료 시 정리 작업
const gracefulShutdown = () => {
  const cleanup = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // 진행 중인 요청 완료 대기
    setTimeout(() => {
      logger.info('Graceful shutdown completed');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGINT', () => cleanup('SIGINT'));
};

module.exports = {
  performanceMonitoring,
  memoryMonitoring,
  errorTracking,
  collectMetrics,
  gracefulShutdown
};
