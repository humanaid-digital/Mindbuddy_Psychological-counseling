const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'general';
    
    // 파일 타입에 따른 하위 디렉토리 설정
    if (file.fieldname === 'licenseFile' || file.fieldname === 'resumeFile') {
      subDir = 'documents';
    } else if (file.fieldname === 'avatar') {
      subDir = 'avatars';
    } else if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    }
    
    const targetDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // 고유한 파일명 생성
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
  // 허용된 파일 타입
  const allowedTypes = {
    'licenseFile': ['.pdf', '.jpg', '.jpeg', '.png'],
    'resumeFile': ['.pdf', '.doc', '.docx'],
    'avatar': ['.jpg', '.jpeg', '.png', '.gif'],
    'chatFile': ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt']
  };
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes['chatFile'];
  
  if (fieldAllowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`${file.fieldname}에는 ${fieldAllowedTypes.join(', ')} 파일만 업로드 가능합니다.`), false);
  }
};

// Multer 설정
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5 // 최대 5개 파일
  }
});

// 에러 처리 미들웨어
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '파일 개수가 너무 많습니다. 최대 5개까지 업로드 가능합니다.'
      });
    }
  }
  
  return res.status(400).json({
    success: false,
    message: error.message || '파일 업로드 중 오류가 발생했습니다.'
  });
};

module.exports = {
  upload,
  handleUploadError
};