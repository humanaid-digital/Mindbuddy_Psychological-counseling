const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Counselor = require('../models/Counselor');
const { auth, clientAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/reviews
// @desc    리뷰 작성
// @access  Private (Client)
router.post('/', [auth, clientAuth], [
  body('bookingId').isMongoId().withMessage('올바른 예약 ID를 입력해주세요'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('평점은 1-5 사이여야 합니다'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('리뷰는 1000자를 초과할 수 없습니다'),
  body('wouldRecommend').optional().isBoolean().withMessage('추천 여부는 true/false여야 합니다'),
  body('isAnonymous').optional().isBoolean().withMessage('익명 여부는 true/false여야 합니다')
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

    const { bookingId, rating, comment, ratings, wouldRecommend, isAnonymous } = req.body;

    // 예약 확인
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    if (booking.client.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: '해당 예약에 대한 리뷰를 작성할 권한이 없습니다'
      });
    }

    // 완료된 세션만 리뷰 가능
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '완료된 상담에 대해서만 리뷰를 작성할 수 있습니다'
      });
    }

    // 이미 리뷰가 있는지 확인
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '이미 해당 상담에 대한 리뷰를 작성하셨습니다'
      });
    }

    // 리뷰 생성
    const review = new Review({
      booking: bookingId,
      client: req.user.userId,
      counselor: booking.counselor,
      rating,
      comment,
      ratings,
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : false,
      status: 'approved' // 자동 승인 (필요시 'pending'으로 변경)
    });

    await review.save();

    // 상담사 평점 업데이트
    const counselor = await Counselor.findById(booking.counselor);
    if (counselor) {
      await counselor.updateRating(rating);
    }

    res.status(201).json({
      success: true,
      message: '리뷰가 성공적으로 등록되었습니다',
      data: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        wouldRecommend: review.wouldRecommend,
        isAnonymous: review.isAnonymous,
        status: review.status,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 작성 중 오류가 발생했습니다'
    });
  }
});

// @route   GET /api/reviews/counselor/:counselorId
// @desc    상담사 리뷰 목록 조회
// @access  Public
router.get('/counselor/:counselorId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
      counselor: req.params.counselorId,
      status: 'approved'
    })
    .populate('client', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Review.countDocuments({
      counselor: req.params.counselorId,
      status: 'approved'
    });

    const reviewsData = reviews.map(review => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      ratings: review.ratings,
      wouldRecommend: review.wouldRecommend,
      clientName: review.isAnonymous ? '익명' : review.client.name,
      createdAt: review.createdAt,
      helpfulVotes: review.helpfulVotes
    }));

    res.json({
      success: true,
      data: {
        reviews: reviewsData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('리뷰 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;