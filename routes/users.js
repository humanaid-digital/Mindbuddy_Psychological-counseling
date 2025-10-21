const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    사용자 프로필 조회
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    사용자 프로필 수정
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다'),
  body('phone').optional().matches(/^[0-9-+().\s]+$/).withMessage('올바른 전화번호를 입력해주세요'),
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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    const { name, phone, birthDate, concerns, preferredMethod, preferredGender, additionalInfo } = req.body;

    // 업데이트할 필드만 수정
    if (name !== undefined) {user.name = name;}
    if (phone !== undefined) {user.phone = phone;}
    if (birthDate !== undefined) {user.birthDate = birthDate ? new Date(birthDate) : null;}
    if (concerns !== undefined) {user.concerns = concerns;}
    if (preferredMethod !== undefined) {user.preferredMethod = preferredMethod;}
    if (preferredGender !== undefined) {user.preferredGender = preferredGender;}
    if (additionalInfo !== undefined) {user.additionalInfo = additionalInfo;}

    await user.save();

    res.json({
      success: true,
      message: '프로필이 성공적으로 수정되었습니다',
      data: user
    });

  } catch (error) {
    console.error('프로필 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 수정 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
