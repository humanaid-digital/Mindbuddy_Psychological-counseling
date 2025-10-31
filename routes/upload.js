const express = require('express');
const path = require('path');
const fs = require('fs');
const Counselor = require('../models/Counselor');
const User = require('../models/User');
const { auth, counselorAuth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/upload/documents
// @desc    상담사 서류 업로드 (자격증, 이력서)
// @access  Private (Counselor)
router.post('/documents', [auth, counselorAuth], 
  upload.fields([
    { name: 'licenseFile', maxCount: 1 },
    { name: 'resumeFile', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const counselor = await Counselor.findOne({ user: req.user.userId });
      if (!counselor) {
        return res.status(404).json({
          success: false,
          message: '상담사 정보를 찾을 수 없습니다'
        });
      }

      const files = req.files;
      const uploadedFiles = {};

      // 자격증 파일 처리
      if (files.licenseFile && files.licenseFile[0]) {
        const file = files.licenseFile[0];
        const relativePath = path.relative(path.join(__dirname, '..'), file.path);
        uploadedFiles.licenseFile = relativePath.replace(/\\/g, '/');
        counselor.licenseFile = uploadedFiles.licenseFile;
      }

      // 이력서 파일 처리
      if (files.resumeFile && files.resumeFile[0]) {
        const file = files.resumeFile[0];
        const relativePath = path.relative(path.join(__dirname, '..'), file.path);
        uploadedFiles.resumeFile = relativePath.replace(/\\/g, '/');
        counselor.resumeFile = uploadedFiles.resumeFile;
      }

      await counselor.save();

      res.json({
        success: true,
        message: '서류가 성공적으로 업로드되었습니다',
        data: uploadedFiles
      });

    } catch (error) {
      console.error('서류 업로드 오류:', error);
      res.status(500).json({
        success: false,
        message: '서류 업로드 중 오류가 발생했습니다'
      });
    }
  },
  handleUploadError
);

// @route   POST /api/upload/avatar
// @desc    프로필 이미지 업로드
// @access  Private
router.post('/avatar', auth, 
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '업로드할 파일을 선택해주세요'
        });
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다'
        });
      }

      // 기존 아바타 파일 삭제
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // 새 아바타 경로 저장
      const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
      user.avatar = relativePath.replace(/\\/g, '/');
      await user.save();

      res.json({
        success: true,
        message: '프로필 이미지가 성공적으로 업로드되었습니다',
        data: {
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('아바타 업로드 오류:', error);
      res.status(500).json({
        success: false,
        message: '이미지 업로드 중 오류가 발생했습니다'
      });
    }
  },
  handleUploadError
);

// @route   GET /api/upload/:filename
// @desc    업로드된 파일 조회
// @access  Public (인증된 사용자만)
router.get('/:subdir/:filename', auth, (req, res) => {
  try {
    const { subdir, filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', subdir, filename);

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다'
      });
    }

    // 파일 전송
    res.sendFile(filePath);

  } catch (error) {
    console.error('파일 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '파일 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;