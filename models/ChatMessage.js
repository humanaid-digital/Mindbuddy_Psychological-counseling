const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  session: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['client', 'counselor'],
    required: true
  },
  message: {
    type: String,
    required: [true, '메시지 내용을 입력해주세요'],
    maxlength: [1000, '메시지는 1000자를 초과할 수 없습니다']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 인덱스 설정
chatMessageSchema.index({ session: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
