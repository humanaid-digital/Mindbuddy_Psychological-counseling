const { DataTypes } = require('sequelize');
const database = require('../config/database');

const ChatMessage = database.getConnection().define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: '메시지 내용을 입력해주세요' },
      len: { args: [1, 5000], msg: '메시지는 5000자를 초과할 수 없습니다' }
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    defaultValue: 'text'
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
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
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  indexes: [
    { fields: ['sessionId', 'createdAt'] },
    { fields: ['senderId', 'createdAt'] },
    { fields: ['receiverId', 'isRead'] }
  ]
});

// 인스턴스 메서드
ChatMessage.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

ChatMessage.prototype.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = ChatMessage;