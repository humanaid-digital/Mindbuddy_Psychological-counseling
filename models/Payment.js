const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Payment = database.getConnection().define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: 0, msg: '결제 금액은 0원 이상이어야 합니다' }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'KRW'
  },
  paymentMethod: {
    type: DataTypes.ENUM('card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'paypal'),
    allowNull: false
  },
  paymentProvider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['bookingId', 'status'] },
    { fields: ['userId', 'createdAt'] },
    { fields: ['status', 'createdAt'] },
    { fields: ['transactionId'], unique: true }
  ]
});

// 인스턴스 메서드
Payment.prototype.markAsPaid = function(transactionId) {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.paidAt = new Date();
  return this.save();
};

Payment.prototype.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failedAt = new Date();
  return this.save();
};

Payment.prototype.processRefund = function(amount, reason) {
  this.status = 'refunded';
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

module.exports = Payment;