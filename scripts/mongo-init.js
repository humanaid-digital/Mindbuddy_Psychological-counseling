// MongoDB 초기화 스크립트 (Docker용)

// 데이터베이스 선택
db = db.getSiblingDB('mindbuddy');

// 사용자 생성
db.createUser({
  user: 'mindbuddy',
  pwd: 'mindbuddy123',
  roles: [
    {
      role: 'readWrite',
      db: 'mindbuddy'
    }
  ]
});

// 인덱스 생성
print('Creating indexes...');

// Users 컬렉션 인덱스
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: -1 });

// Counselors 컬렉션 인덱스
db.counselors.createIndex({ user: 1 }, { unique: true });
db.counselors.createIndex({ status: 1 });
db.counselors.createIndex({ specialties: 1 });
db.counselors.createIndex({ 'rating.average': -1 });
db.counselors.createIndex({ fee: 1 });
db.counselors.createIndex({ isActive: 1 });

// Bookings 컬렉션 인덱스
db.bookings.createIndex({ client: 1 });
db.bookings.createIndex({ counselor: 1 });
db.bookings.createIndex({ date: 1, startTime: 1 });
db.bookings.createIndex({ status: 1 });
db.bookings.createIndex({ sessionId: 1 }, { unique: true, sparse: true });

// Reviews 컬렉션 인덱스
db.reviews.createIndex({ booking: 1 }, { unique: true });
db.reviews.createIndex({ counselor: 1 });
db.reviews.createIndex({ rating: -1 });
db.reviews.createIndex({ status: 1 });

print('Indexes created successfully');

// 관리자 계정 생성 (프로덕션에서는 제거하거나 보안 강화 필요)
if (db.users.countDocuments({ email: 'admin@mindbuddy.com' }) === 0) {
  db.users.insertOne({
    name: '관리자',
    email: 'admin@mindbuddy.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', // admin123! 해싱된 값
    phone: '010-0000-0000',
    role: 'admin',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  print('Admin user created');
}

print('MongoDB initialization completed');
