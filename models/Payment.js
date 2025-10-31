const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, '결제 금액을 입력해주세요'],
    min: [0, '결제 금액은 0원 이상이어야 합니다']
  },
  platformFee: {
    type: Number,
    default: 0
  },
  counselorAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'kakao_pay', 'naver_pay'],
    required: true
  },
  paymentProvider: {
    type: String,
    enum: ['toss', 'iamport', 'kakao', 'naver'],
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    maxlength: [500, '환불 사유는 500자를 초과할 수 없습니다']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
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

// 인덱스 설정
paymentSchema.index({ booking: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ counselor: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
