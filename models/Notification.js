const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Notification = database.getConnection().define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  type: {
    type: DataTypes.ENUM(
      'booking_confirmed', 'booking_cancelled', 'booking_reminder',
      'session_started', 'session_ended', 'message_received',
      'review_received', 'payment_completed', 'system_announcement'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [1, 100], msg: '제목은 100자를 초과할 수 없습니다' }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: { args: [1, 500], msg: '메시지는 500자를 초과할 수 없습니다' }
    }
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  channels: {
    type: DataTypes.ARRAY(DataTypes.ENUM('web', 'email', 'sms', 'push')),
    defaultValue: ['web']
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['recipientId', 'isRead', 'createdAt'] },
    { fields: ['type', 'createdAt'] },
    { fields: ['priority', 'isRead'] }
  ]
});

// 인스턴스 메서드
Notification.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

Notification.prototype.markAsSent = function(channels = ['web']) {
  this.channels = channels;
  this.sentAt = new Date();
  return this.save();
};

// 정적 메서드
Notification.getUnreadCount = function(userId) {
  return this.count({ 
    where: { 
      recipientId: userId, 
      isRead: false 
    } 
  });
};

Notification.createAndSend = async function(notificationData) {
  const notification = await this.create(notificationData);

  // 실시간 알림 전송 (Socket.IO)
  const io = require('../server').io;
  if (io) {
    io.to(`user_${notification.recipientId}`).emit('notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt
    });
  }

  return notification;
};

module.exports = Notification;