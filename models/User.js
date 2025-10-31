const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const database = require('../config/database');

const User = database.getConnection().define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: '이름을 입력해주세요' },
      len: { args: [1, 50], msg: '이름은 50자를 초과할 수 없습니다' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: '올바른 이메일 형식이 아닙니다' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [6, 255], msg: '비밀번호는 최소 6자 이상이어야 합니다' }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: { args: /^[0-9-+().\s]+$/, msg: '올바른 전화번호 형식이 아닙니다' }
    }
  },
  birthDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('client', 'counselor', 'admin'),
    defaultValue: 'client'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  concerns: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'depression', 'anxiety', 'trauma', 'relationship', 
      'family', 'work', 'self-esteem', 'other'
    )),
    defaultValue: []
  },
  preferredMethod: {
    type: DataTypes.ENUM('video', 'voice', 'chat', 'all'),
    defaultValue: 'all'
  },
  preferredGender: {
    type: DataTypes.ENUM('male', 'female', 'any'),
    defaultValue: 'any'
  },
  additionalInfo: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 500], msg: '추가 정보는 500자를 초과할 수 없습니다' }
    }
  },
  marketingConsent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] },
    { fields: ['isActive'] },
    { fields: ['role', 'isActive'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 인스턴스 메서드
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;