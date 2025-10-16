const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '접근 권한이 없습니다. 로그인이 필요합니다.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = decoded;
    req.userInfo = user;
    next();
  } catch (error) {
    console.error('인증 오류:', error);
    
    let message = '유효하지 않은 토큰입니다.';
    let code = 'INVALID_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      message = '토큰이 만료되었습니다. 다시 로그인해주세요.';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = '잘못된 토큰 형식입니다.';
      code = 'MALFORMED_TOKEN';
    }
    
    res.status(401).json({
      success: false,
      message,
      code
    });
  }
};

// 관리자 권한 확인 미들웨어
const adminAuth = async (req, res, next) => {
  try {
    if (req.userInfo.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    next();
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다.'
    });
  }
};

// 상담사 권한 확인 미들웨어
const counselorAuth = async (req, res, next) => {
  try {
    if (req.userInfo.role !== 'counselor') {
      return res.status(403).json({
        success: false,
        message: '상담사 권한이 필요합니다.'
      });
    }
    next();
  } catch (error) {
    console.error('상담사 권한 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다.'
    });
  }
};

// 상담자 권한 확인 미들웨어
const clientAuth = async (req, res, next) => {
  try {
    if (req.userInfo.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: '상담자 권한이 필요합니다.'
      });
    }
    next();
  } catch (error) {
    console.error('상담자 권한 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  counselorAuth,
  clientAuth
};