const express = require('express');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    관리자 대시보드 통계
// @access  Private (Admin)
router.get('/dashboard', [auth, adminAuth], async (req, res) => {
  try {
    // 기본 통계
    const totalUsers = await User.countDocuments({ role: 'client', isActive: true });
    const totalCounselors = await Counselor.countDocuments({ status: 'approved', isActive: true });
    const totalSessions = await Booking.countDocuments({ status: 'completed' });
    
    // 이번 달 통계
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const thisMonthUsers = await User.countDocuments({
      role: 'client',
      createdAt: { $gte: currentMonth }
    });
    
    const thisMonthSessions = await Booking.countDocuments({
      status: 'completed',
      createdAt: { $gte: currentMonth }
    });

    // 수익 계산 (실제로는 결제 데이터에서 계산)
    const completedBookings = await Booking.find({
      status: 'completed',
      createdAt: { $gte: currentMonth }
    });
    
    const thisMonthRevenue = completedBookings.reduce((total, booking) => {
      return total + (booking.fee * 0.15); // 15% 수수료 가정
    }, 0);

    // 대기 중인 상담사 승인
    const pendingCounselors = await Counselor.find({ status: 'pending' })
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = {
      totalUsers,
      totalCounselors,
      totalSessions,
      thisMonthRevenue,
      growth: {
        users: thisMonthUsers,
        sessions: thisMonthSessions
      },
      pendingCounselors: pendingCounselors.map(counselor => ({
        id: counselor._id,
        name: counselor.user.name,
        email: counselor.user.email,
        license: counselor.license,
        experience: counselor.experience,
        appliedAt: counselor.createdAt
      }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('관리자 대시보드 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '대시보드 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/admin/counselors/pending
// @desc    승인 대기 상담사 목록
// @access  Private (Admin)
router.get('/counselors/pending', [auth, adminAuth], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const counselors = await Counselor.find({ status: 'pending' })
      .populate('user', 'name email phone createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Counselor.countDocuments({ status: 'pending' });

    const counselorsData = counselors.map(counselor => ({
      id: counselor._id,
      name: counselor.user.name,
      email: counselor.user.email,
      phone: counselor.user.phone,
      license: counselor.license,
      licenseNumber: counselor.licenseNumber,
      university: counselor.university,
      experience: counselor.experience,
      specialties: counselor.specialties,
      fee: counselor.fee,
      introduction: counselor.introduction,
      licenseFile: counselor.licenseFile,
      resumeFile: counselor.resumeFile,
      appliedAt: counselor.createdAt
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
        }
      }
    });

  } catch (error) {
    console.error('대기 상담사 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '목록 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/admin/counselors/:id/approve
// @desc    상담사 승인
// @access  Private (Admin)
router.put('/counselors/:id/approve', [auth, adminAuth], async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id);
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: '상담사를 찾을 수 없습니다'
      });
    }

    if (counselor.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '대기 중인 상담사만 승인할 수 있습니다'
      });
    }

    counselor.status = 'approved';
    counselor.approvedAt = new Date();
    counselor.approvedBy = req.user.userId;
    await counselor.save();

    res.json({
      success: true,
      message: '상담사가 승인되었습니다',
      data: {
        id: counselor._id,
        status: counselor.status,
        approvedAt: counselor.approvedAt
      }
    });

  } catch (error) {
    console.error('상담사 승인 오류:', error);
    res.status(500).json({
      success: false,
      message: '승인 처리 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/admin/counselors/:id/reject
// @desc    상담사 거절
// @access  Private (Admin)
router.put('/counselors/:id/reject', [auth, adminAuth], async (req, res) => {
  try {
    const { reason } = req.body;
    
    const counselor = await Counselor.findById(req.params.id);
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: '상담사를 찾을 수 없습니다'
      });
    }

    if (counselor.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '대기 중인 상담사만 거절할 수 있습니다'
      });
    }

    counselor.status = 'rejected';
    counselor.rejectionReason = reason;
    counselor.approvedBy = req.user.userId;
    await counselor.save();

    res.json({
      success: true,
      message: '상담사 신청이 거절되었습니다',
      data: {
        id: counselor._id,
        status: counselor.status,
        rejectionReason: counselor.rejectionReason
      }
    });

  } catch (error) {
    console.error('상담사 거절 오류:', error);
    res.status(500).json({
      success: false,
      message: '거절 처리 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    관리자 통계
// @access  Private (Admin)
router.get('/stats', [auth, adminAuth], async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    
    const totalUsers = await User.countDocuments({ role: 'client' });
    const totalCounselors = await Counselor.countDocuments({ status: 'approved' });
    const totalSessions = await Booking.countDocuments();
    
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCounselors,
        totalSessions,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/admin/payments/recent
// @desc    최근 결제 내역
// @access  Private (Admin)
router.get('/payments/recent', [auth, adminAuth], async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    
    const payments = await Payment.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('결제 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '결제 내역 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;