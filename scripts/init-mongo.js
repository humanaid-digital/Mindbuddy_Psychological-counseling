// MongoDB 초기화 스크립트
db = db.getSiblingDB('mindbuddy');

// 관리자 계정 생성
db.users.insertOne({
  name: '관리자',
  email: 'admin@mindbuddy.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.2', // admin123
  phone: '010-0000-0000',
  role: 'admin',
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 인덱스 생성
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.counselors.createIndex({ user: 1 });
db.counselors.createIndex({ status: 1 });
db.counselors.createIndex({ specialties: 1 });
db.counselors.createIndex({ 'rating.average': -1 });

db.bookings.createIndex({ client: 1 });
db.bookings.createIndex({ counselor: 1 });
db.bookings.createIndex({ date: 1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ sessionId: 1 });

db.reviews.createIndex({ booking: 1 }, { unique: true });
db.reviews.createIndex({ counselor: 1 });
db.reviews.createIndex({ status: 1 });

print('MongoDB 초기화 완료');