const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    required: true
  },
  // 평점 (1-5)
  rating: {
    type: Number,
    required: [true, '평점을 선택해주세요'],
    min: [1, '평점은 최소 1점 이상이어야 합니다'],
    max: [5, '평점은 최대 5점을 초과할 수 없습니다']
  },
  // 리뷰 내용
  comment: {
    type: String,
    maxlength: [1000, '리뷰는 1000자를 초과할 수 없습니다']
  },
  // 세부 평가 항목
  ratings: {
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    helpfulness: {
      type: Number,
      min: 1,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  // 추천 여부
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  // 익명 여부
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // 상태
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // 관리자 검토
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: [500, '거절 사유는 500자를 초과할 수 없습니다']
  },
  // 도움이 됨 투표
  helpfulVotes: {
    type: Number,
    default: 0
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
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 리뷰 승인
reviewSchema.methods.approve = function(adminId) {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  return this.save();
};

// 리뷰 거절
reviewSchema.methods.reject = function(adminId, reason) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// 인덱스 설정
reviewSchema.index({ booking: 1 });
reviewSchema.index({ client: 1 });
reviewSchema.index({ counselor: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
