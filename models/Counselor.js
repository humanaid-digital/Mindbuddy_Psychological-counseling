const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 자격 및 경력
  license: {
    type: String,
    required: [true, '자격증을 선택해주세요'],
    enum: ['clinical', 'counseling', 'social', 'other']
  },
  licenseNumber: {
    type: String,
    required: [true, '자격증 번호를 입력해주세요']
  },
  university: {
    type: String,
    required: [true, '최종학력을 입력해주세요'],
    maxlength: [100, '최종학력은 100자를 초과할 수 없습니다']
  },
  experience: {
    type: Number,
    required: [true, '경력을 입력해주세요'],
    min: [0, '경력은 0년 이상이어야 합니다'],
    max: [50, '경력은 50년을 초과할 수 없습니다']
  },
  careerDetails: {
    type: String,
    maxlength: [1000, '상세 경력사항은 1000자를 초과할 수 없습니다']
  },
  // 전문 분야
  specialties: [{
    type: String,
    enum: ['depression', 'anxiety', 'trauma', 'relationship', 'family', 'couple', 'child', 'addiction']
  }],
  // 상담 정보
  fee: {
    type: Number,
    required: [true, '상담료를 입력해주세요'],
    min: [10000, '상담료는 최소 10,000원 이상이어야 합니다'],
    max: [500000, '상담료는 최대 500,000원을 초과할 수 없습니다']
  },
  methods: [{
    type: String,
    enum: ['video', 'voice', 'chat'],
    default: ['video']
  }],
  introduction: {
    type: String,
    required: [true, '자기소개를 입력해주세요'],
    maxlength: [2000, '자기소개는 2000자를 초과할 수 없습니다']
  },
  // 서류
  licenseFile: {
    type: String,
    required: [true, '자격증 파일을 업로드해주세요']
  },
  resumeFile: {
    type: String,
    required: [true, '이력서 파일을 업로드해주세요']
  },
  // 승인 상태
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    maxlength: [500, '거절 사유는 500자를 초과할 수 없습니다']
  },
  // 평점 및 리뷰
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // 상담 통계
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    cancelledSessions: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  // 가용성
  availability: {
    monday: [{
      start: String,
      end: String
    }],
    tuesday: [{
      start: String,
      end: String
    }],
    wednesday: [{
      start: String,
      end: String
    }],
    thursday: [{
      start: String,
      end: String
    }],
    friday: [{
      start: String,
      end: String
    }],
    saturday: [{
      start: String,
      end: String
    }],
    sunday: [{
      start: String,
      end: String
    }]
  },
  // 계정 상태
  isActive: {
    type: Boolean,
    default: true
  },
  // 생성/수정 시간
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시간 자동 갱신
counselorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 평점 계산 메서드
counselorSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// 인덱스 설정
counselorSchema.index({ user: 1 });
counselorSchema.index({ status: 1 });
counselorSchema.index({ specialties: 1 });
counselorSchema.index({ 'rating.average': -1 });
counselorSchema.index({ fee: 1 });
counselorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Counselor', counselorSchema);
