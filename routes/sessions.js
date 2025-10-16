const express = require('express');
const Booking = require('../models/Booking');
const Counselor = require('../models/Counselor');
const { auth } = require('../middleware/auth');
const jitsiService = require('../utils/jitsi');

const router = express.Router();

// @route   GET /api/sessions/:sessionId
// @desc    세션 정보 조회
// @access  Private
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ sessionId: req.params.sessionId })
      .populate('client', 'name')
      .populate({
        path: 'counselor',
        populate: {
          path: 'user',
          select: 'name'
        }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '세션을 찾을 수 없습니다'
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
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '해당 세션에 접근할 권한이 없습니다'
      });
    }

    // Jitsi Meet 설정 생성 (화상상담인 경우)
    let jitsiConfig = null;
    if (booking.method === 'video') {
      const roomName = jitsiService.generateRoomName(booking.sessionId);
      const userInfo = {
        id: req.user.userId,
        name: req.userInfo.name,
        email: req.userInfo.email,
        role: req.userInfo.role
      };
      
      jitsiConfig = jitsiService.generateMeetingConfig(roomName, userInfo, {
        startWithAudioMuted: req.userInfo.role === 'client',
        startWithVideoMuted: false
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: booking.sessionId,
        client: {
          name: booking.client.name
        },
        counselor: {
          name: booking.counselor.user.name
        },
        method: booking.method,
        status: booking.status,
        startedAt: booking.sessionStartedAt,
        duration: booking.duration,
        jitsiConfig: jitsiConfig
      }
    });

  } catch (error) {
    console.error('세션 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '세션 조회 중 오류가 발생했습니다'
    });
  }
});

// @route   PUT /api/sessions/:sessionId/end
// @desc    세션 종료
// @access  Private
router.put('/:sessionId/end', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ sessionId: req.params.sessionId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '세션을 찾을 수 없습니다'
      });
    }

    if (booking.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: '진행 중인 세션만 종료할 수 있습니다'
      });
    }

    await booking.endSession();

    // Jitsi Meet 세션 정리
    if (booking.method === 'video') {
      const roomName = jitsiService.generateRoomName(booking.sessionId);
      await jitsiService.cleanupSession(roomName);
    }

    res.json({
      success: true,
      message: '세션이 종료되었습니다',
      data: {
        sessionId: booking.sessionId,
        status: booking.status,
        endedAt: booking.sessionEndedAt,
        actualDuration: booking.actualDuration
      }
    });

  } catch (error) {
    console.error('세션 종료 오류:', error);
    res.status(500).json({
      success: false,
      message: '세션 종료 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;