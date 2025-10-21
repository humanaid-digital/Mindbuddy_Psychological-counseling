const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const { auth } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/security');

const router = express.Router();

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register/client
// @desc    상담자 회원가입
// @access  Public
router.post('/register/client', registerLimiter, [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일을 입력해주세요'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('phone').matches(/^[0-9-+().\s]+$/).withMessage('올바른 전화번호를 입력해주세요'),
  body('concerns').optional().isArray().withMessage('관심 분야는 배열 형태여야 합니다'),
  body('preferredMethod').optional().isIn(['video', 'voice', 'chat', 'all']).withMessage('올바른 상담 방식을 선택해주세요'),
  body('preferredGender').optional().isIn(['male', 'female', 'any']).withMessage('올바른 성별을 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 정보를 확인해주세요',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, birthDate, concerns, preferredMethod, preferredGender, additionalInfo, marketingConsent } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다'
      });
    }

    // 사용자 생성
    const user = new User({
      name,
      email,
      password,
      phone,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      role: 'client',
      concerns: concerns || [],
      preferredMethod: preferredMethod || 'all',
      preferredGender: preferredGender || 'any',
      additionalInfo,
      marketingConsent: marketingConsent || false
    });

    await user.save();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('상담자 회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다'
    });
  }
});

// @route   POST /api/auth/register/counselor
// @desc    상담사 회원가입
// @access  Public
router.post('/register/counselor', registerLimiter, [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일을 입력해주세요'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
  body('phone').matches(/^[0-9-+().\s]+$/).withMessage('올바른 전화번호를 입력해주세요'),
  body('license').isIn(['clinical', 'counseling', 'social', 'other']).withMessage('올바른 자격증을 선택해주세요'),
  body('licenseNumber').trim().isLength({ min: 1 }).withMessage('자격증 번호를 입력해주세요'),
  body('university').trim().isLength({ min: 1, max: 100 }).withMessage('최종학력을 입력해주세요'),
  body('experience').isInt({ min: 0, max: 50 }).withMessage('경력은 0-50년 사이여야 합니다'),
  body('specialties').isArray({ min: 1 }).withMessage('최소 1개의 전문분야를 선택해주세요'),
  body('fee').isInt({ min: 10000, max: 500000 }).withMessage('상담료는 10,000-500,000원 사이여야 합니다'),
  body('introduction').trim().isLength({ min: 10, max: 2000 }).withMessage('자기소개는 10-2000자 사이여야 합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 정보를 확인해주세요',
        errors: errors.array()
      });
    }

    const {
      name, email, password, phone, birthDate,
      license, licenseNumber, university, experience, careerDetails,
      specialties, fee, methods, introduction
    } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다'
      });
    }

    // 사용자 생성
    const user = new User({
      name,
      email,
      password,
      phone,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      role: 'counselor'
    });

    await user.save();

    // 상담사 프로필 생성
    const counselor = new Counselor({
      user: user._id,
      license,
      licenseNumber,
      university,
      experience,
      careerDetails,
      specialties,
      fee,
      methods: methods || ['video'],
      introduction,
      // 파일은 별도 업로드 API에서 처리
      licenseFile: 'pending',
      resumeFile: 'pending',
      status: 'pending'
    });

    await counselor.save();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '상담사 가입 신청이 완료되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        counselor: {
          id: counselor._id,
          status: counselor.status
        },
        token
      }
    });

  } catch (error) {
    console.error('상담사 회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다'
    });
  }
});

// @route   POST /api/auth/login
// @desc    로그인
// @access  Public
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('올바른 이메일을 입력해주세요'),
  body('password').isLength({ min: 1 }).withMessage('비밀번호를 입력해주세요'),
  body('userType').optional().isIn(['client', 'counselor']).withMessage('올바른 사용자 유형을 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 정보를 확인해주세요',
        errors: errors.array()
      });
    }

    const { email, password, userType } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // 사용자 유형 확인
    if (userType && user.role !== userType) {
      return res.status(401).json({
        success: false,
        message: '선택한 사용자 유형과 일치하지 않습니다'
      });
    }

    // 상담사인 경우 승인 상태 확인
    let counselorData = null;
    if (user.role === 'counselor') {
      const counselor = await Counselor.findOne({ user: user._id });
      if (!counselor || counselor.status !== 'approved') {
        return res.status(401).json({
          success: false,
          message: '상담사 승인이 완료되지 않았습니다. 관리자 승인을 기다려주세요.'
        });
      }
      counselorData = {
        id: counselor._id,
        status: counselor.status,
        specialties: counselor.specialties,
        rating: counselor.rating
      };
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '로그인이 완료되었습니다',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        counselor: counselorData,
        token
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/auth/me
// @desc    현재 사용자 정보 조회
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    let counselorData = null;
    if (user.role === 'counselor') {
      const counselor = await Counselor.findOne({ user: user._id });
      if (counselor) {
        counselorData = {
          id: counselor._id,
          status: counselor.status,
          specialties: counselor.specialties,
          rating: counselor.rating,
          stats: counselor.stats
        };
      }
    }

    res.json({
      success: true,
      data: {
        user,
        counselor: counselorData
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    로그아웃
// @access  Private
router.post('/logout', auth, (req, res) => {
  // JWT는 stateless이므로 클라이언트에서 토큰 삭제
  res.json({
    success: true,
    message: '로그아웃이 완료되었습니다'
  });
});

module.exports = router;
