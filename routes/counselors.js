const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const Review = require('../models/Review');
const { auth, counselorAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/counselors
// @desc    상담사 목록 조회 (필터링, 정렬, 페이징)
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 숫자여야 합니다'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('제한은 1-50 사이의 숫자여야 합니다'),
  query('specialty').optional().isIn(['depression', 'anxiety', 'trauma', 'relationship', 'family', 'couple', 'child', 'addiction']).withMessage('올바른 전문분야를 선택해주세요'),
  query('minFee').optional().isInt({ min: 0 }).withMessage('최소 상담료는 0 이상이어야 합니다'),
  query('maxFee').optional().isInt({ min: 0 }).withMessage('최대 상담료는 0 이상이어야 합니다'),
  query('method').optional().isIn(['video', 'voice', 'chat']).withMessage('올바른 상담방식을 선택해주세요'),
  query('sortBy').optional().isIn(['rating', 'experience', 'fee-low', 'fee-high', 'newest']).withMessage('올바른 정렬 기준을 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '검색 조건을 확인해주세요',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 12,
      specialty,
      minFee,
      maxFee,
      method,
      sortBy = 'rating',
      search
    } = req.query;

    // 필터 조건 구성
    const filter = {
      status: 'approved',
      isActive: true
    };

    if (specialty) {
      filter.specialties = { $in: [specialty] };
    }

    if (minFee || maxFee) {
      filter.fee = {};
      if (minFee) filter.fee.$gte = parseInt(minFee);
      if (maxFee) filter.fee.$lte = parseInt(maxFee);
    }

    if (method) {
      filter.methods = { $in: [method] };
    }

    // 정렬 조건 구성
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'rating.average': -1, 'rating.count': -1 };
        break;
      case 'experience':
        sort = { experience: -1 };
        break;
      case 'fee-low':
        sort = { fee: 1 };
        break;
      case 'fee-high':
        sort = { fee: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { 'rating.average': -1 };
    }

    // 페이징 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 상담사 조회
    let query = Counselor.find(filter)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // 검색어가 있는 경우
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const userIds = await User.find({
        name: searchRegex
      }).distinct('_id');

      filter.$or = [
        { user: { $in: userIds } },
        { introduction: searchRegex },
        { specialties: { $in: [searchRegex] } }
      ];
    }

    const counselors = await query;
    const total = await Counselor.countDocuments(filter);

    // 응답 데이터 구성
    const counselorsData = counselors.map(counselor => ({
      id: counselor._id,
      name: counselor.user.name,
      avatar: counselor.user.avatar,
      specialties: counselor.specialties,
      experience: counselor.experience,
      fee: counselor.fee,
      methods: counselor.methods,
      introduction: counselor.introduction.substring(0, 200) + (counselor.introduction.length > 200 ? '...' : ''),
      rating: counselor.rating,
      stats: {
        totalSessions: counselor.stats.totalSessions,
        completedSessions: counselor.stats.completedSessions
      }
    }));

    res.json({
      success: true,
      data: {
        counselors: counselorsData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        filters: {
          specialty,
          minFee,
          maxFee,
          method,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('상담사 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상담사 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/counselors/:id
// @desc    상담사 상세 정보 조회
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id)
      .populate('user', 'name avatar createdAt')
      .populate({
        path: 'user',
        select: 'name avatar createdAt'
      });

    if (!counselor || counselor.status !== 'approved' || !counselor.isActive) {
      return res.status(404).json({
        success: false,
        message: '상담사를 찾을 수 없습니다'
      });
    }

    // 최근 리뷰 조회
    const recentReviews = await Review.find({
      counselor: counselor._id,
      status: 'approved'
    })
    .populate('client', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    const counselorData = {
      id: counselor._id,
      name: counselor.user.name,
      avatar: counselor.user.avatar,
      license: counselor.license,
      university: counselor.university,
      experience: counselor.experience,
      careerDetails: counselor.careerDetails,
      specialties: counselor.specialties,
      fee: counselor.fee,
      methods: counselor.methods,
      introduction: counselor.introduction,
      rating: counselor.rating,
      stats: counselor.stats,
      availability: counselor.availability,
      joinedAt: counselor.user.createdAt,
      recentReviews: recentReviews.map(review => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        clientName: review.isAnonymous ? '익명' : review.client.name,
        createdAt: review.createdAt,
        wouldRecommend: review.wouldRecommend
      }))
    };

    res.json({
      success: true,
      data: counselorData
    });

  } catch (error) {
    console.error('상담사 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상담사 정보 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/counselors/:id/availability
// @desc    상담사 가용 시간 조회
// @access  Public
router.get('/:id/availability', [
  query('date').optional().isISO8601().withMessage('올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '날짜 형식을 확인해주세요',
        errors: errors.array()
      });
    }

    const counselor = await Counselor.findById(req.params.id);
    if (!counselor || counselor.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: '상담사를 찾을 수 없습니다'
      });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // 해당 요일의 가용 시간
    const availability = counselor.availability[dayOfWeek] || [];

    // 이미 예약된 시간 조회 (실제로는 Booking 모델에서 조회해야 함)
    // const bookedSlots = await Booking.find({
    //   counselor: counselor._id,
    //   date: targetDate,
    //   status: { $in: ['confirmed', 'in-progress'] }
    // }).select('startTime endTime');

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek,
        availability,
        // bookedSlots: bookedSlots.map(slot => ({
        //   startTime: slot.startTime,
        //   endTime: slot.endTime
        // }))
      }
    });

  } catch (error) {
    console.error('상담사 가용시간 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '가용시간 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/counselors/profile
// @desc    상담사 프로필 수정
// @access  Private (Counselor)
router.put('/profile', [auth, counselorAuth], [
  body('introduction').optional().isLength({ min: 10, max: 2000 }).withMessage('자기소개는 10-2000자 사이여야 합니다'),
  body('fee').optional().isInt({ min: 10000, max: 500000 }).withMessage('상담료는 10,000-500,000원 사이여야 합니다'),
  body('methods').optional().isArray().withMessage('상담방식은 배열 형태여야 합니다'),
  body('specialties').optional().isArray().withMessage('전문분야는 배열 형태여야 합니다')
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

    const counselor = await Counselor.findOne({ user: req.user.userId });
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: '상담사 정보를 찾을 수 없습니다'
      });
    }

    const { introduction, fee, methods, specialties, availability } = req.body;

    // 업데이트할 필드만 수정
    if (introduction !== undefined) counselor.introduction = introduction;
    if (fee !== undefined) counselor.fee = fee;
    if (methods !== undefined) counselor.methods = methods;
    if (specialties !== undefined) counselor.specialties = specialties;
    if (availability !== undefined) counselor.availability = availability;

    await counselor.save();

    res.json({
      success: true,
      message: '프로필이 성공적으로 수정되었습니다',
      data: {
        id: counselor._id,
        introduction: counselor.introduction,
        fee: counselor.fee,
        methods: counselor.methods,
        specialties: counselor.specialties,
        availability: counselor.availability
      }
    });

  } catch (error) {
    console.error('상담사 프로필 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 수정 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/counselors/dashboard/stats
// @desc    상담사 대시보드 통계
// @access  Private (Counselor)
router.get('/dashboard/stats', [auth, counselorAuth], async (req, res) => {
  try {
    const counselor = await Counselor.findOne({ user: req.user.userId });
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: '상담사 정보를 찾을 수 없습니다'
      });
    }

    // 이번 달 통계 계산 (실제로는 Booking 모델에서 집계)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const stats = {
      totalSessions: counselor.stats.totalSessions,
      completedSessions: counselor.stats.completedSessions,
      cancelledSessions: counselor.stats.cancelledSessions,
      totalEarnings: counselor.stats.totalEarnings,
      averageRating: counselor.rating.average,
      totalReviews: counselor.rating.count,
      // 이번 달 통계는 실제 예약 데이터에서 계산
      thisMonth: {
        sessions: 0,
        earnings: 0,
        newClients: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('상담사 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;