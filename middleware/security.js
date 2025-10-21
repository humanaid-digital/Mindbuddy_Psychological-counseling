const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { hasSQLInjection, hasNoSQLInjection, isSecureText } = require('../utils/validation');

/**
 * 보안 미들웨어 설정
 */

// Rate limiting 설정
const createRateLimit = (windowMs, max, message) => {
  // 테스트 환경에서는 Rate Limiting 비활성화
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// 일반 API 요청 제한
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15분
  100, // 최대 100회 요청
  '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
);

// 로그인 요청 제한
const loginLimiter = createRateLimit(
  15 * 60 * 1000, // 15분
  5, // 최대 5회 시도
  '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.'
);

// 회원가입 요청 제한
const registerLimiter = createRateLimit(
  60 * 60 * 1000, // 1시간
  3, // 최대 3회 시도
  '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.'
);

// 비밀번호 재설정 요청 제한
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1시간
  3, // 최대 3회 시도
  '비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.'
);

// Helmet 보안 헤더 설정
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
      fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
      scriptSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'wss:', 'ws:'],
      mediaSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      childSrc: ['\'self\''],
      workerSrc: ['\'self\''],
      frameSrc: ['\'self\'', 'https://meet.jit.si']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

// 강화된 입력 데이터 검증 및 정화
const sanitizeInput = (req, res, next) => {
  // 보안 강화된 문자열 정화
  const sanitizeString = (str) => {
    if (typeof str !== 'string') {return str;}
    
    // 길이 제한 (DoS 방지)
    if (str.length > 10000) {
      throw new Error('Input too long');
    }

    // 보안 검증
    if (!isSecureText(str, 10000)) {
      throw new Error('Invalid input detected');
    }

    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };

  // 재귀적으로 객체의 모든 문자열 값을 정화
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // 키 이름도 검증
        if (typeof key === 'string' && !isSecureText(key, 100)) {
          throw new Error('Invalid key detected');
        }
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  };

  try {
    // 요청 본문 정화
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // 쿼리 파라미터 정화
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // URL 파라미터 정화
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: '잘못된 입력입니다.',
      code: 'INVALID_INPUT'
    });
  }
};

// 강화된 Injection 방지
const preventInjection = (req, res, next) => {
  // SQL Injection 검사
  const checkSQLInjection = (data) => {
    if (typeof data === 'string') {
      return hasSQLInjection(data);
    }
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (checkSQLInjection(key) || checkSQLInjection(data[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // NoSQL Injection 검사
  const checkNoSQLInjection = (data) => {
    return hasNoSQLInjection(data);
  };

  // 모든 입력 데이터 검사
  const inputSources = [req.body, req.query, req.params];
  
  for (const source of inputSources) {
    if (source && (checkSQLInjection(source) || checkNoSQLInjection(source))) {
      return res.status(400).json({
        success: false,
        message: '보안 위험이 감지된 요청입니다.',
        code: 'SECURITY_THREAT_DETECTED'
      });
    }
  }

  next();
};

// CORS 설정 개선
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // 개발 환경에서는 origin이 없는 요청도 허용 (Postman 등)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단된 요청입니다.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24시간
};

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  helmetConfig,
  sanitizeInput,
  preventInjection,
  corsOptions
};
