const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

const Booking = database.getConnection().define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  counselorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'counselors',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: '상담 날짜를 선택해주세요' }
    }
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: { msg: '시작 시간을 선택해주세요' }
    }
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: { msg: '종료 시간을 선택해주세요' }
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    validate: {
      min: { args: 30, msg: '상담 시간은 최소 30분 이상이어야 합니다' },
      max: { args: 120, msg: '상담 시간은 최대 120분을 초과할 수 없습니다' }
    }
  },
  method: {
    type: DataTypes.ENUM('video', 'voice', 'chat'),
    allowNull: false,
    validate: {
      notEmpty: { msg: '상담 방식을 선택해주세요' }
    }
  },
  topic: {
    type: DataTypes.ENUM('depression', 'anxiety', 'trauma', 'relationship', 'family', 'work', 'other'),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 1000], msg: '메모는 1000자를 초과할 수 없습니다' }
    }
  },
  fee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 0, msg: '상담료는 0원 이상이어야 합니다' }
    }
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'pending'
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 500], msg: '취소 사유는 500자를 초과할 수 없습니다' }
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  sessionStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sessionEndedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  indexes: [
    { fields: ['clientId'] },
    { fields: ['counselorId'] },
    { fields: ['date'] },
    { fields: ['status'] },
    { fields: ['paymentStatus'] },
    { fields: ['sessionId'] },
    { fields: ['counselorId', 'date', 'status'] },
    { fields: ['clientId', 'createdAt'] },
    { fields: ['date', 'startTime', 'endTime'] },
    { fields: ['status', 'paymentStatus'] }
  ]
});

// 인스턴스 메서드
Booking.prototype.generateSessionId = function() {
  this.sessionId = uuidv4();
  return this.sessionId;
};

Booking.prototype.startSession = function() {
  this.status = 'in-progress';
  this.sessionStartedAt = new Date();
  if (!this.sessionId) {
    this.generateSessionId();
  }
  return this.save();
};

Booking.prototype.endSession = function() {
  this.status = 'completed';
  this.sessionEndedAt = new Date();

  if (this.sessionStartedAt) {
    this.actualDuration = Math.round((this.sessionEndedAt - this.sessionStartedAt) / (1000 * 60));
  }

  return this.save();
};

Booking.prototype.cancel = function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

module.exports = Booking;