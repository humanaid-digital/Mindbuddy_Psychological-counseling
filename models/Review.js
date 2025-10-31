const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Review = database.getConnection().define('Review', {
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
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 1, msg: '평점은 1점 이상이어야 합니다' },
      max: { args: 5, msg: '평점은 5점 이하여야 합니다' }
    }
  },
  comment: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 1000], msg: '리뷰는 1000자를 초과할 수 없습니다' }
    }
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isReported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reportReason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { fields: ['counselorId', 'createdAt'] },
    { fields: ['clientId', 'createdAt'] },
    { fields: ['rating'] },
    { fields: ['bookingId'], unique: true }
  ]
});

module.exports = Review;