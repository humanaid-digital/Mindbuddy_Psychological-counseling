const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 메시지 내용
  message: {
    type: String,
    required: [true, '메시지 내용을 입력해주세요'],
    maxlength: [1000, '메시지는 1000자를 초과할 수 없습니다']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  // 파일 정보 (파일 메시지인 경우)
  fileName: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileSize: {
    type: Number
  },
  // 메시지 상태
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // 생성 시간
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 메시지 읽음 처리
chatMessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// 인덱스 설정
chatMessageSchema.index({ booking: 1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ isRead: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
