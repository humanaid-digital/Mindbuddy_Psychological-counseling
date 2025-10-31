const { DataTypes } = require('sequelize');
const database = require('../config/database');

const Counselor = database.getConnection().define('Counselor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  license: {
    type: DataTypes.ENUM('clinical', 'counseling', 'social', 'other'),
    allowNull: false,
    validate: {
      notEmpty: { msg: '자격증을 선택해주세요' }
    }
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '자격증 번호를 입력해주세요' }
    }
  },
  university: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: '최종학력을 입력해주세요' },
      len: { args: [1, 100], msg: '최종학력은 100자를 초과할 수 없습니다' }
    }
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 0, msg: '경력은 0년 이상이어야 합니다' },
      max: { args: 50, msg: '경력은 50년을 초과할 수 없습니다' }
    }
  },
  careerDetails: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 1000], msg: '상세 경력사항은 1000자를 초과할 수 없습니다' }
    }
  },
  specialties: {
    type: DataTypes.ARRAY(DataTypes.ENUM(
      'depression', 'anxiety', 'trauma', 'relationship', 
      'family', 'couple', 'child', 'addiction'
    )),
    defaultValue: []
  },
  fee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: 10000, msg: '상담료는 최소 10,000원 이상이어야 합니다' },
      max: { args: 500000, msg: '상담료는 최대 500,000원을 초과할 수 없습니다' }
    }
  },
  methods: {
    type: DataTypes.ARRAY(DataTypes.ENUM('video', 'voice', 'chat')),
    defaultValue: ['video']
  },
  introduction: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: '자기소개를 입력해주세요' },
      len: { args: [1, 2000], msg: '자기소개는 2000자를 초과할 수 없습니다' }
    }
  },
  licenseFile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '자격증 파일을 업로드해주세요' }
    }
  },
  resumeFile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '이력서 파일을 업로드해주세요' }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 500], msg: '거절 사유는 500자를 초과할 수 없습니다' }
    }
  },
  ratingAverage: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cancelledSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  availability: {
    type: DataTypes.JSONB,
    defaultValue: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'counselors',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['specialties'] },
    { fields: ['ratingAverage'] },
    { fields: ['fee'] },
    { fields: ['isActive'] },
    { fields: ['status', 'isActive'] },
    { fields: ['specialties', 'ratingAverage', 'fee', 'status'] }
  ]
});

// 인스턴스 메서드
Counselor.prototype.updateRating = function(newRating) {
  const totalRating = (this.ratingAverage * this.ratingCount) + newRating;
  this.ratingCount += 1;
  this.ratingAverage = totalRating / this.ratingCount;
  return this.save();
};

module.exports = Counselor;