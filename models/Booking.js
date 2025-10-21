const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  // 예약 정보
  date: {
    type: Date,
    required: [true, '상담 날짜를 선택해주세요']
  },
  startTime: {
    type: String,
    required: [true, '시작 시간을 선택해주세요'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '올바른 시간 형식이 아닙니다 (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, '종료 시간을 선택해주세요'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '올바른 시간 형식이 아닙니다 (HH:MM)']
  },
  duration: {
    type: Number,
    default: 50, // 분 단위
    min: [30, '상담 시간은 최소 30분 이상이어야 합니다'],
    max: [120, '상담 시간은 최대 120분을 초과할 수 없습니다']
  },
  // 상담 방식
  method: {
    type: String,
    required: [true, '상담 방식을 선택해주세요'],
    enum: ['video', 'voice', 'chat']
  },
  // 상담 주제
  topic: {
    type: String,
    enum: ['depression', 'anxiety', 'trauma', 'relationship', 'family', 'work', 'other']
  },
  notes: {
    type: String,
    maxlength: [1000, '메모는 1000자를 초과할 수 없습니다']
  },
  // 결제 정보
  fee: {
    type: Number,
    required: true,
    min: [0, '상담료는 0원 이상이어야 합니다']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  paidAt: {
    type: Date
  },
  // 예약 상태
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  // 취소 정보
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: [500, '취소 사유는 500자를 초과할 수 없습니다']
  },
  // 세션 정보
  sessionId: {
    type: String,
    unique: true,
    sparse: true
  },
  sessionStartedAt: {
    type: Date
  },
  sessionEndedAt: {
    type: Date
  },
  actualDuration: {
    type: Number // 실제 상담 시간 (분)
  },
  // 리마인더
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
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
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 세션 ID 생성
bookingSchema.methods.generateSessionId = function() {
  const { v4: uuidv4 } = require('uuid');
  this.sessionId = uuidv4();
  return this.sessionId;
};

// 상담 시작
bookingSchema.methods.startSession = function() {
  this.status = 'in-progress';
  this.sessionStartedAt = new Date();
  if (!this.sessionId) {
    this.generateSessionId();
  }
  return this.save();
};

// 상담 종료
bookingSchema.methods.endSession = function() {
  this.status = 'completed';
  this.sessionEndedAt = new Date();

  if (this.sessionStartedAt) {
    this.actualDuration = Math.round((this.sessionEndedAt - this.sessionStartedAt) / (1000 * 60));
  }

  return this.save();
};

// 예약 취소
bookingSchema.methods.cancel = function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// 인덱스 설정
bookingSchema.index({ client: 1 });
bookingSchema.index({ counselor: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ sessionId: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
