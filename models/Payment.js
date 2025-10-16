const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    required: true
  },
  // 결제 정보
  amount: {
    type: Number,
    required: [true, '결제 금액을 입력해주세요'],
    min: [0, '결제 금액은 0원 이상이어야 합니다']
  },
  currency: {
    type: String,
    default: 'KRW',
    enum: ['KRW', 'USD']
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss_pay'],
    required: true
  },
  // 외부 결제 시스템 정보
  paymentGateway: {
    type: String,
    enum: ['toss', 'iamport', 'kakao', 'naver'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  // 결제 상태
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // 수수료 정보
  platformFee: {
    type: Number,
    default: 0
  },
  counselorAmount: {
    type: Number,
    required: true
  },
  // 환불 정보
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    maxlength: [500, '환불 사유는 500자를 초과할 수 없습니다']
  },
  refundedAt: {
    type: Date
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 결제 완료 시간
  completedAt: {
    type: Date
  },
  // 실패 정보
  failureReason: {
    type: String
  },
  failedAt: {
    type: Date
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
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 결제 완료 처리
paymentSchema.methods.complete = function(transactionId, gatewayResponse) {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.gatewayResponse = gatewayResponse;
  this.completedAt = new Date();
  return this.save();
};

// 결제 실패 처리
paymentSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failedAt = new Date();
  return this.save();
};

// 환불 처리
paymentSchema.methods.refund = function(amount, reason, adminId) {
  this.status = 'refunded';
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  this.refundedBy = adminId;
  return this.save();
};

// 수수료 계산 (저장 전 자동 계산)
paymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    // 플랫폼 수수료 15% 계산
    this.platformFee = Math.round(this.amount * 0.15);
    this.counselorAmount = this.amount - this.platformFee;
  }
  next();
});

// 인덱스 설정
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ counselor: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentGateway: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);