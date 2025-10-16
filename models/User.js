const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '이름을 입력해주세요'],
    trim: true,
    maxlength: [50, '이름은 50자를 초과할 수 없습니다']
  },
  email: {
    type: String,
    required: [true, '이메일을 입력해주세요'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '올바른 이메일 형식이 아닙니다']
  },
  password: {
    type: String,
    required: [true, '비밀번호를 입력해주세요'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다']
  },
  phone: {
    type: String,
    required: [true, '연락처를 입력해주세요'],
    match: [/^[0-9-+().\s]+$/, '올바른 전화번호 형식이 아닙니다']
  },
  birthDate: {
    type: Date
  },
  role: {
    type: String,
    enum: ['client', 'counselor', 'admin'],
    default: 'client'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  // 상담자 전용 필드
  concerns: [{
    type: String,
    enum: ['depression', 'anxiety', 'trauma', 'relationship', 'family', 'work', 'self-esteem', 'other']
  }],
  preferredMethod: {
    type: String,
    enum: ['video', 'voice', 'chat', 'all'],
    default: 'all'
  },
  preferredGender: {
    type: String,
    enum: ['male', 'female', 'any'],
    default: 'any'
  },
  additionalInfo: {
    type: String,
    maxlength: [500, '추가 정보는 500자를 초과할 수 없습니다']
  },
  // 마케팅 동의
  marketingConsent: {
    type: Boolean,
    default: false
  },
  // 계정 생성/수정 시간
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 업데이트 시간 자동 갱신
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// JSON 변환 시 비밀번호 제외
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// 인덱스 설정
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);