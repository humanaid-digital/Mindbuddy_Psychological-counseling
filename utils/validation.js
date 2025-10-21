const validator = require('validator');

/**
 * 보안 강화된 유효성 검증 유틸리티
 * validator 패키지의 취약점을 보완하는 추가 검증 로직
 */

/**
 * 안전한 URL 검증
 * validator.isURL의 취약점을 보완하는 추가 검증
 */
const isSecureURL = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 기본 URL 형식 검증
  try {
    const urlObj = new URL(url);

    // 허용된 프로토콜만 허용
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // 로컬 IP 주소 차단 (SSRF 방지)
    const hostname = urlObj.hostname;
    if (isLocalIP(hostname)) {
      return false;
    }

    // 추가 보안 검증
    if (urlObj.username || urlObj.password) {
      return false; // 인증 정보가 포함된 URL 차단
    }

    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_host: true,
      require_valid_protocol: true,
      allow_underscores: false,
      host_whitelist: false,
      host_blacklist: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    });
  } catch (error) {
    return false;
  }
};

/**
 * 로컬 IP 주소 검증
 */
const isLocalIP = (hostname) => {
  // IPv4 로컬 주소 패턴
  const localIPv4Patterns = [
    /^127\./,           // 127.0.0.0/8 (loopback)
    /^10\./,            // 10.0.0.0/8 (private)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (private)
    /^192\.168\./,      // 192.168.0.0/16 (private)
    /^169\.254\./,      // 169.254.0.0/16 (link-local)
    /^0\./              // 0.0.0.0/8
  ];

  // IPv6 로컬 주소
  const localIPv6Patterns = [
    /^::1$/,            // loopback
    /^fe80:/,           // link-local
    /^fc00:/,           // unique local
    /^fd00:/            // unique local
  ];

  // localhost 체크
  if (hostname === 'localhost') {
    return true;
  }

  // IPv4 체크
  for (const pattern of localIPv4Patterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  // IPv6 체크
  for (const pattern of localIPv6Patterns) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  return false;
};

/**
 * 안전한 이메일 검증
 */
const isSecureEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // 길이 제한
  if (email.length > 254) {
    return false;
  }

  // 기본 이메일 형식 검증
  if (!validator.isEmail(email)) {
    return false;
  }

  // 추가 보안 검증
  const [localPart, domain] = email.split('@');

  // 로컬 파트 검증
  if (localPart.length > 64) {
    return false;
  }

  // 도메인 검증
  if (domain.length > 253) {
    return false;
  }

  // 위험한 문자 패턴 검사
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /[\x00-\x1f]/,
    /[\x7f-\x9f]/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  return true;
};

/**
 * 안전한 전화번호 검증
 */
const isSecurePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // 길이 제한
  if (phone.length > 20) {
    return false;
  }

  // 허용된 문자만 포함 (숫자, 하이픈, 괄호, 공백, 플러스)
  const phonePattern = /^[0-9\-()s+.]+$/;
  if (!phonePattern.test(phone)) {
    return false;
  }

  // 최소 숫자 개수 확인 (최소 7자리)
  const digitCount = (phone.match(/\d/g) || []).length;
  if (digitCount < 7) {
    return false;
  }

  return true;
};

/**
 * 안전한 텍스트 입력 검증
 */
const isSecureText = (text, maxLength = 1000) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // 길이 제한
  if (text.length > maxLength) {
    return false;
  }

  // XSS 방지를 위한 위험한 패턴 검사
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  return true;
};

/**
 * 파일명 검증
 */
const isSecureFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // 길이 제한
  if (filename.length > 255) {
    return false;
  }

  // 위험한 문자 패턴 검사
  const dangerousPatterns = [
    /\.\./,           // 디렉토리 순회
    /[<>:"|?*]/,      // 파일시스템 예약 문자
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows 예약어
    /^\./,            // 숨김 파일
    /[\x00-\x1f]/,      // 제어 문자
    /[\x7f-\x9f]/       // 확장 제어 문자
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      return false;
    }
  }

  // 허용된 확장자만 허용
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', // 이미지
    '.pdf', '.doc', '.docx', '.txt', '.rtf',          // 문서
    '.zip', '.rar', '.7z'                             // 압축파일
  ];

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return false;
  }

  return true;
};

/**
 * SQL Injection 패턴 검사
 */
const hasSQLInjection = (input) => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /('|(\\')|(;)|(\\;)|(\|)|(\*)|(%)|(\+)|(\\+))/gi,
    /((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))/gi,
    /((%27)|(')).*((%6F)|o|(%4F))((%72)|r|(%52))/gi,
    /((%27)|(')).union/gi
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }

  return false;
};

/**
 * NoSQL Injection 패턴 검사
 */
const hasNoSQLInjection = (input) => {
  if (typeof input === 'object' && input !== null) {
    // 객체에서 위험한 연산자 검사
    const dangerousOperators = [
      '$where', '$ne', '$gt', '$lt', '$gte', '$lte',
      '$regex', '$or', '$and', '$nor', '$not',
      '$exists', '$type', '$mod', '$all', '$size',
      '$elemMatch', '$slice'
    ];

    const checkObject = (obj) => {
      for (const key in obj) {
        if (dangerousOperators.includes(key)) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) {
            return true;
          }
        }
      }
      return false;
    };

    return checkObject(input);
  }

  if (typeof input === 'string') {
    const nosqlPatterns = [
      /\$where/gi,
      /\$ne/gi,
      /\$gt/gi,
      /\$lt/gi,
      /\$regex/gi,
      /\$or/gi,
      /\$and/gi,
      /javascript:/gi,
      /function\s*\(/gi,
      /eval\s*\(/gi
    ];

    for (const pattern of nosqlPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
  }

  return false;
};

module.exports = {
  isSecureURL,
  isSecureEmail,
  isSecurePhone,
  isSecureText,
  isSecureFilename,
  hasSQLInjection,
  hasNoSQLInjection,
  isLocalIP
};
