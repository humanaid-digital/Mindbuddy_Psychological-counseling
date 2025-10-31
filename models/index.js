const database = require('../config/database');

// 모델 import
const User = require('./User');
const Counselor = require('./Counselor');
const Booking = require('./Booking');
const Review = require('./Review');
const ChatMessage = require('./ChatMessage');
const Notification = require('./Notification');
const Payment = require('./Payment');

// 관계 설정
const setupAssociations = () => {
  // User - Counselor (1:1)
  User.hasOne(Counselor, { 
    foreignKey: 'userId', 
    as: 'counselorProfile',
    onDelete: 'CASCADE'
  });
  Counselor.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });

  // User - Booking (1:N as client)
  User.hasMany(Booking, { 
    foreignKey: 'clientId', 
    as: 'clientBookings',
    onDelete: 'CASCADE'
  });
  Booking.belongsTo(User, { 
    foreignKey: 'clientId', 
    as: 'client' 
  });

  // Counselor - Booking (1:N)
  Counselor.hasMany(Booking, { 
    foreignKey: 'counselorId', 
    as: 'counselorBookings',
    onDelete: 'CASCADE'
  });
  Booking.belongsTo(Counselor, { 
    foreignKey: 'counselorId', 
    as: 'counselor' 
  });

  // Booking - Review (1:1)
  Booking.hasOne(Review, { 
    foreignKey: 'bookingId', 
    as: 'review',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Booking, { 
    foreignKey: 'bookingId', 
    as: 'booking' 
  });

  // User - Review (1:N as client)
  User.hasMany(Review, { 
    foreignKey: 'clientId', 
    as: 'clientReviews',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(User, { 
    foreignKey: 'clientId', 
    as: 'client' 
  });

  // Counselor - Review (1:N)
  Counselor.hasMany(Review, { 
    foreignKey: 'counselorId', 
    as: 'counselorReviews',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Counselor, { 
    foreignKey: 'counselorId', 
    as: 'counselor' 
  });

  // User - ChatMessage (1:N as sender)
  User.hasMany(ChatMessage, { 
    foreignKey: 'senderId', 
    as: 'sentMessages',
    onDelete: 'CASCADE'
  });
  ChatMessage.belongsTo(User, { 
    foreignKey: 'senderId', 
    as: 'sender' 
  });

  // User - ChatMessage (1:N as receiver)
  User.hasMany(ChatMessage, { 
    foreignKey: 'receiverId', 
    as: 'receivedMessages',
    onDelete: 'CASCADE'
  });
  ChatMessage.belongsTo(User, { 
    foreignKey: 'receiverId', 
    as: 'receiver' 
  });

  // User - Notification (1:N as recipient)
  User.hasMany(Notification, { 
    foreignKey: 'recipientId', 
    as: 'receivedNotifications',
    onDelete: 'CASCADE'
  });
  Notification.belongsTo(User, { 
    foreignKey: 'recipientId', 
    as: 'recipient' 
  });

  // User - Notification (1:N as sender)
  User.hasMany(Notification, { 
    foreignKey: 'senderId', 
    as: 'sentNotifications',
    onDelete: 'SET NULL'
  });
  Notification.belongsTo(User, { 
    foreignKey: 'senderId', 
    as: 'sender' 
  });

  // Booking - Payment (1:1)
  Booking.hasOne(Payment, { 
    foreignKey: 'bookingId', 
    as: 'payment',
    onDelete: 'CASCADE'
  });
  Payment.belongsTo(Booking, { 
    foreignKey: 'bookingId', 
    as: 'booking' 
  });

  // User - Payment (1:N)
  User.hasMany(Payment, { 
    foreignKey: 'userId', 
    as: 'payments',
    onDelete: 'CASCADE'
  });
  Payment.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });

  // Counselor approval relationship
  User.hasMany(Counselor, { 
    foreignKey: 'approvedBy', 
    as: 'approvedCounselors',
    onDelete: 'SET NULL'
  });
  Counselor.belongsTo(User, { 
    foreignKey: 'approvedBy', 
    as: 'approver' 
  });

  // Booking cancellation relationship
  User.hasMany(Booking, { 
    foreignKey: 'cancelledBy', 
    as: 'cancelledBookings',
    onDelete: 'SET NULL'
  });
  Booking.belongsTo(User, { 
    foreignKey: 'cancelledBy', 
    as: 'canceller' 
  });
};

// 데이터베이스 초기화
const initializeDatabase = async () => {
  try {
    // 데이터베이스 연결
    await database.connect();
    
    // 관계 설정
    setupAssociations();
    
    // 테이블 동기화 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      await database.getConnection().sync({ alter: true });
      console.log('✅ 데이터베이스 테이블 동기화 완료');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
};

module.exports = {
  database,
  User,
  Counselor,
  Booking,
  Review,
  ChatMessage,
  Notification,
  Payment,
  setupAssociations,
  initializeDatabase
};