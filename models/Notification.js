const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 알림 내용
  title: {
    type: String,
    required: [true, '알림 제목을 입력해주세요'],
    maxlength: [100, '제목은 100자를 초과할 수 없습니다']
  },
  message: {
    type: String,
    required: [true, '알림 메시지를 입력해주세요'],
    maxlength: [500, '메시지는 500자를 초과할 수 없습니다']
  },
  type: {
    type: String,
    enum: ['booking', 'payment', 'review', 'system', 'reminder'],
    required: true
  },
  // 관련 데이터
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['booking', 'review', 'payment', 'user', 'counselor']
  },
  // 알림 상태
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // 전송 정보
  channels: [{
    type: String,
    enum: ['web', 'email', 'sms', 'push']
  }],
  sentAt: {
    type: Date
  },
  // 생성 시간
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 알림 읽음 처리
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// 알림 전송 처리
notificationSchema.methods.markAsSent = function(channels = ['web']) {
  this.channels = channels;
  this.sentAt = new Date();
  return this.save();
};

// 정적 메서드: 사용자별 읽지 않은 알림 수
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// 정적 메서드: 알림 생성 및 전송
notificationSchema.statics.createAndSend = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // 실시간 알림 전송 (Socket.IO)
  const io = require('../server').io;
  if (io) {
    io.to(`user_${notification.user}`).emit('notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt
    });
  }
  
  return notification;
};

// 인덱스 설정
notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);