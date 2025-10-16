// MongoDB 데이터베이스 초기화 스크립트
// 사용법: node scripts/init-database.js

const mongoose = require('mongoose');
require('dotenv').config();

// 데이터베이스 연결
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbuddy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
}

// 인덱스 생성
async function createIndexes() {
  const db = mongoose.connection.db;
  
  try {
    console.log('📊 인덱스 생성 중...');

    // Users 컬렉션 인덱스
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    console.log('✅ Users 인덱스 생성 완료');

    // Counselors 컬렉션 인덱스
    await db.collection('counselors').createIndex({ user: 1 }, { unique: true });
    await db.collection('counselors').createIndex({ status: 1 });
    await db.collection('counselors').createIndex({ specialties: 1 });
    await db.collection('counselors').createIndex({ 'rating.average': -1 });
    await db.collection('counselors').createIndex({ fee: 1 });
    await db.collection('counselors').createIndex({ isActive: 1 });
    await db.collection('counselors').createIndex({ createdAt: -1 });
    console.log('✅ Counselors 인덱스 생성 완료');

    // Bookings 컬렉션 인덱스
    await db.collection('bookings').createIndex({ client: 1 });
    await db.collection('bookings').createIndex({ counselor: 1 });
    await db.collection('bookings').createIndex({ date: 1, startTime: 1 });
    await db.collection('bookings').createIndex({ status: 1 });
    await db.collection('bookings').createIndex({ sessionId: 1 }, { unique: true, sparse: true });
    await db.collection('bookings').createIndex({ paymentStatus: 1 });
    await db.collection('bookings').createIndex({ createdAt: -1 });
    console.log('✅ Bookings 인덱스 생성 완료');

    // Reviews 컬렉션 인덱스
    await db.collection('reviews').createIndex({ booking: 1 }, { unique: true });
    await db.collection('reviews').createIndex({ counselor: 1 });
    await db.collection('reviews').createIndex({ client: 1 });
    await db.collection('reviews').createIndex({ rating: -1 });
    await db.collection('reviews').createIndex({ status: 1 });
    await db.collection('reviews').createIndex({ createdAt: -1 });
    console.log('✅ Reviews 인덱스 생성 완료');

    console.log('🎉 모든 인덱스 생성 완료');
  } catch (error) {
    console.error('❌ 인덱스 생성 실패:', error);
  }
}

// 샘플 데이터 생성
async function createSampleData() {
  const User = require('../models/User');
  const Counselor = require('../models/Counselor');
  
  try {
    console.log('📝 샘플 데이터 생성 중...');

    // 관리자 계정 생성
    const adminExists = await User.findOne({ email: 'admin@mindbuddy.com' });
    if (!adminExists) {
      const admin = new User({
        name: '관리자',
        email: 'admin@mindbuddy.com',
        password: 'admin123!',
        phone: '010-0000-0000',
        role: 'admin',
        isVerified: true
      });
      await admin.save();
      console.log('✅ 관리자 계정 생성 완료');
    }

    // 샘플 상담자 계정 생성
    const clientExists = await User.findOne({ email: 'client@test.com' });
    if (!clientExists) {
      const client = new User({
        name: '김상담',
        email: 'client@test.com',
        password: 'test123!',
        phone: '010-1111-1111',
        role: 'client',
        concerns: ['depression', 'anxiety'],
        preferredMethod: 'video',
        preferredGender: 'any',
        isVerified: true
      });
      await client.save();
      console.log('✅ 샘플 상담자 계정 생성 완료');
    }

    // 샘플 상담사 계정 생성
    const counselorUserExists = await User.findOne({ email: 'counselor@test.com' });
    if (!counselorUserExists) {
      const counselorUser = new User({
        name: '이상담',
        email: 'counselor@test.com',
        password: 'test123!',
        phone: '010-2222-2222',
        role: 'counselor',
        isVerified: true
      });
      await counselorUser.save();

      // 상담사 프로필 생성
      const counselor = new Counselor({
        user: counselorUser._id,
        license: 'clinical',
        licenseNumber: 'CL-2024-001',
        university: '서울대학교 심리학과',
        experience: 8,
        careerDetails: '서울대학교병원 정신건강의학과에서 8년간 근무',
        specialties: ['depression', 'anxiety', 'trauma'],
        fee: 80000,
        methods: ['video', 'voice'],
        introduction: '안녕하세요. 8년간 다양한 심리적 어려움을 겪고 있는 분들과 함께해왔습니다. 특히 우울증과 불안장애 치료에 전문성을 가지고 있으며, 내담자 중심의 따뜻한 상담을 진행합니다.',
        licenseFile: 'sample-license.pdf',
        resumeFile: 'sample-resume.pdf',
        status: 'approved',
        approvedAt: new Date(),
        rating: {
          average: 4.9,
          count: 127
        },
        stats: {
          totalSessions: 156,
          completedSessions: 148,
          cancelledSessions: 8,
          totalEarnings: 12480000
        },
        availability: {
          monday: [{ start: '09:00', end: '18:00' }],
          tuesday: [{ start: '09:00', end: '18:00' }],
          wednesday: [{ start: '09:00', end: '18:00' }],
          thursday: [{ start: '09:00', end: '18:00' }],
          friday: [{ start: '09:00', end: '18:00' }]
        }
      });
      await counselor.save();
      console.log('✅ 샘플 상담사 계정 및 프로필 생성 완료');
    }

    console.log('🎉 샘플 데이터 생성 완료');
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error);
  }
}

// 데이터베이스 상태 확인
async function checkDatabaseStatus() {
  const User = require('../models/User');
  const Counselor = require('../models/Counselor');
  
  try {
    console.log('📊 데이터베이스 상태 확인 중...');
    
    const userCount = await User.countDocuments();
    const clientCount = await User.countDocuments({ role: 'client' });
    const counselorUserCount = await User.countDocuments({ role: 'counselor' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const counselorProfileCount = await Counselor.countDocuments();
    const approvedCounselorCount = await Counselor.countDocuments({ status: 'approved' });
    
    console.log('📈 데이터베이스 통계:');
    console.log(`   총 사용자: ${userCount}명`);
    console.log(`   상담자: ${clientCount}명`);
    console.log(`   상담사 계정: ${counselorUserCount}명`);
    console.log(`   관리자: ${adminCount}명`);
    console.log(`   상담사 프로필: ${counselorProfileCount}개`);
    console.log(`   승인된 상담사: ${approvedCounselorCount}명`);
    
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 마인드버디 데이터베이스 초기화 시작');
  
  await connectDB();
  await createIndexes();
  await createSampleData();
  await checkDatabaseStatus();
  
  console.log('✅ 데이터베이스 초기화 완료');
  console.log('');
  console.log('📋 테스트 계정 정보:');
  console.log('   관리자: admin@mindbuddy.com / admin123!');
  console.log('   상담자: client@test.com / test123!');
  console.log('   상담사: counselor@test.com / test123!');
  
  process.exit(0);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 초기화 실패:', error);
    process.exit(1);
  });
}

module.exports = {
  connectDB,
  createIndexes,
  createSampleData,
  checkDatabaseStatus
};