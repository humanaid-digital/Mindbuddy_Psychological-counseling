const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Counselor = require('../models/Counselor');
// const User = require('../models/User'); // 사용하지 않음
const { auth, clientAuth, counselorAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    상담 예약 생성
// @access  Private (Client)
router.post('/', [auth, clientAuth], [
  body('counselorId').isMongoId().withMessage('올바른 상담사 ID를 입력해주세요'),
  body('date').isISO8601().withMessage('올바른 날짜 형식을 입력해주세요'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('올바른 시작 시간을 입력해주세요'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('올바른 종료 시간을 입력해주세요'),
  body('method').isIn(['video', 'voice', 'chat']).withMessage('올바른 상담 방식을 선택해주세요'),
  body('topic').optional().isIn(['depression', 'anxiety', 'trauma', 'relationship', 'family', 'work', 'other']).withMessage('올바른 상담 주제를 선택해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '예약 정보를 확인해주세요',
        errors: errors.array()
      });
    }

    const { counselorId, date, startTime, endTime, method, topic, notes } = req.body;

    // 상담사 확인
    const counselor = await Counselor.findById(counselorId).populate('user');
    if (!counselor || counselor.status !== 'approved' || !counselor.isActive) {
      return res.status(404).json({
        success: false,
        message: '상담사를 찾을 수 없습니다'
      });
    }

    // 상담 방식 지원 확인
    if (!counselor.methods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: '해당 상담사가 지원하지 않는 상담 방식입니다'
      });
    }

    // 시간 유효성 검사
    const bookingDate = new Date(date);
    const now = new Date();

    if (bookingDate < now) {
      return res.status(400).json({
        success: false,
        message: '과거 날짜로는 예약할 수 없습니다'
      });
    }

    // 시간 계산
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (duration <= 0 || duration > 120) {
      return res.status(400).json({
        success: false,
        message: '상담 시간은 1분 이상 120분 이하여야 합니다'
      });
    }

    // 중복 예약 확인 - 같은 날짜의 시간 겹침 체크
    const startDateTime = new Date(bookingDate);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMin, 0, 0);
    
    const endDateTime = new Date(bookingDate);
    endDateTime.setHours(endHour, endMin, 0, 0);

    const existingBooking = await Booking.findOne({
      counselor: counselorId,
      date: {
        $gte: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate()),
        $lt: new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate() + 1)
      },
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } }
          ]
        },
        {
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } }
          ]
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: '해당 시간에 이미 예약이 있습니다'
      });
    }

    // 예약 생성
    const booking = new Booking({
      client: req.user.userId,
      counselor: counselorId,
      date: bookingDate,
      startTime,
      endTime,
      duration,
      method,
      topic,
      notes,
      fee: counselor.fee,
      status: 'pending'
    });

    await booking.save();

    // 예약 정보와 함께 응답
    const bookingData = await Booking.findById(booking._id)
      .populate('client', 'name email phone')
      .populate({
        path: 'counselor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.status(201).json({
      success: true,
      message: '예약이 성공적으로 생성되었습니다',
      data: {
        id: bookingData._id,
        client: {
          name: bookingData.client.name,
          email: bookingData.client.email
        },
        counselor: {
          name: bookingData.counselor.user.name,
          specialties: bookingData.counselor.specialties
        },
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        duration: bookingData.duration,
        method: bookingData.method,
        topic: bookingData.topic,
        fee: bookingData.fee,
        status: bookingData.status,
        createdAt: bookingData.createdAt
      }
    });

  } catch (error) {
    console.error('예약 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '예약 생성 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/bookings
// @desc    예약 목록 조회 (사용자별)
// @access  Private
router.get('/', auth, [
  query('status').optional().isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('올바른 상태를 선택해주세요'),
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('제한은 1-50 사이여야 합니다')
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

    const { status, page = 1, limit = 10 } = req.query;
    const userRole = req.userInfo.role;

    // 필터 조건 구성
    const filter = {};

    if (userRole === 'client') {
      filter.client = req.user.userId;
    } else if (userRole === 'counselor') {
      const counselor = await Counselor.findOne({ user: req.user.userId });
      if (!counselor) {
        return res.status(404).json({
          success: false,
          message: '상담사 정보를 찾을 수 없습니다'
        });
      }
      filter.counselor = counselor._id;
    }

    if (status) {
      filter.status = status;
    }

    // 페이징
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 예약 조회
    const bookings = await Booking.find(filter)
      .populate('client', 'name email phone')
      .populate({
        path: 'counselor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    // 응답 데이터 구성
    const bookingsData = bookings.map(booking => ({
      id: booking._id,
      client: userRole === 'counselor' ? {
        name: booking.client.name
        // 상담사에게는 민감한 정보 제한
      } : {
        name: booking.client.name,
        email: booking.client.email,
        phone: booking.client.phone
      },
      counselor: {
        id: booking.counselor._id,
        name: booking.counselor.user.name,
        specialties: booking.counselor.specialties,
        rating: booking.counselor.rating
      },
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      method: booking.method,
      topic: booking.topic,
      notes: booking.notes,
      fee: booking.fee,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      sessionId: booking.sessionId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: {
        bookings: bookingsData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('예약 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '예약 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    예약 상세 조회
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate({
        path: 'counselor',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    const userRole = req.userInfo.role;
    let hasAccess = false;

    if (userRole === 'client' && booking.client._id.toString() === req.user.userId) {
      hasAccess = true;
    } else if (userRole === 'counselor') {
      const counselor = await Counselor.findOne({ user: req.user.userId });
      if (counselor && booking.counselor._id.toString() === counselor._id.toString()) {
        hasAccess = true;
      }
    } else if (userRole === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '해당 예약에 접근할 권한이 없습니다'
      });
    }

    res.json({
      success: true,
      data: {
        id: booking._id,
        client: {
          name: booking.client.name,
          email: booking.client.email,
          phone: booking.client.phone
        },
        counselor: {
          id: booking.counselor._id,
          name: booking.counselor.user.name,
          specialties: booking.counselor.specialties,
          rating: booking.counselor.rating
        },
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        method: booking.method,
        topic: booking.topic,
        notes: booking.notes,
        fee: booking.fee,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        sessionId: booking.sessionId,
        sessionStartedAt: booking.sessionStartedAt,
        sessionEndedAt: booking.sessionEndedAt,
        actualDuration: booking.actualDuration,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }
    });

  } catch (error) {
    console.error('예약 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '예약 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    예약 확정 (상담사)
// @access  Private (Counselor)
router.put('/:id/confirm', [auth, counselorAuth], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    const counselor = await Counselor.findOne({ user: req.user.userId });
    if (!counselor || booking.counselor.toString() !== counselor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '해당 예약을 확정할 권한이 없습니다'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '대기 중인 예약만 확정할 수 있습니다'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.json({
      success: true,
      message: '예약이 확정되었습니다',
      data: {
        id: booking._id,
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    });

  } catch (error) {
    console.error('예약 확정 오류:', error);
    res.status(500).json({
      success: false,
      message: '예약 확정 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    예약 취소
// @access  Private
router.put('/:id/cancel', auth, [
  body('reason').optional().isLength({ max: 500 }).withMessage('취소 사유는 500자를 초과할 수 없습니다')
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

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    const userRole = req.userInfo.role;
    let hasAccess = false;

    if (userRole === 'client' && booking.client.toString() === req.user.userId) {
      hasAccess = true;
    } else if (userRole === 'counselor') {
      const counselor = await Counselor.findOne({ user: req.user.userId });
      if (counselor && booking.counselor.toString() === counselor._id.toString()) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '해당 예약을 취소할 권한이 없습니다'
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: '진행 중이거나 완료된 예약은 취소할 수 없습니다'
      });
    }

    // 취소 시간 확인 (예약 시간 24시간 전까지만 무료 취소)
    const bookingDateTime = new Date(booking.date);
    const [hour, minute] = booking.startTime.split(':');
    bookingDateTime.setHours(parseInt(hour), parseInt(minute));

    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      return res.status(400).json({
        success: false,
        message: '예약 시간 24시간 전까지만 취소할 수 있습니다'
      });
    }

    const { reason } = req.body;
    await booking.cancel(req.user.userId, reason);

    res.json({
      success: true,
      message: '예약이 취소되었습니다',
      data: {
        id: booking._id,
        status: booking.status,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason
      }
    });

  } catch (error) {
    console.error('예약 취소 오류:', error);
    res.status(500).json({
      success: false,
      message: '예약 취소 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/bookings/:id/start
// @desc    상담 세션 시작
// @access  Private (Counselor)
router.put('/:id/start', [auth, counselorAuth], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    const counselor = await Counselor.findOne({ user: req.user.userId });
    if (!counselor || booking.counselor.toString() !== counselor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '해당 세션을 시작할 권한이 없습니다'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: '확정된 예약만 시작할 수 있습니다'
      });
    }

    await booking.startSession();

    res.json({
      success: true,
      message: '상담 세션이 시작되었습니다',
      data: {
        id: booking._id,
        sessionId: booking.sessionId,
        status: booking.status,
        sessionStartedAt: booking.sessionStartedAt
      }
    });

  } catch (error) {
    console.error('세션 시작 오류:', error);
    res.status(500).json({
      success: false,
      message: '세션 시작 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
