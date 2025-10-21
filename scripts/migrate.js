// 데이터베이스 마이그레이션 스크립트
// 사용법: node scripts/migrate.js

const mongoose = require('mongoose');
require('dotenv').config();

// 마이그레이션 버전 관리
const migrationSchema = new mongoose.Schema({
  version: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  executedAt: { type: Date, default: Date.now }
});

const Migration = mongoose.model('Migration', migrationSchema);

// 마이그레이션 목록
const migrations = [
  {
    version: '1.0.0',
    description: '초기 데이터베이스 구조 생성',
    up: async () => {
      console.log('📊 초기 컬렉션 및 인덱스 생성...');

      const db = mongoose.connection.db;

      // 컬렉션 생성 (필요시)
      const collections = ['users', 'counselors', 'bookings', 'reviews', 'chatmessages', 'notifications', 'payments'];

      for (const collectionName of collections) {
        try {
          await db.createCollection(collectionName);
          console.log(`✅ ${collectionName} 컬렉션 생성`);
        } catch (error) {
          if (error.code !== 48) { // Collection already exists
            throw error;
          }
          console.log(`ℹ️  ${collectionName} 컬렉션 이미 존재`);
        }
      }
    }
  },
  {
    version: '1.1.0',
    description: '성능 최적화 인덱스 추가',
    up: async () => {
      console.log('🚀 성능 최적화 인덱스 생성...');

      const db = mongoose.connection.db;

      // 복합 인덱스 추가
      await db.collection('bookings').createIndex({
        counselor: 1,
        date: 1,
        status: 1
      });

      await db.collection('bookings').createIndex({
        client: 1,
        status: 1,
        date: -1
      });

      await db.collection('reviews').createIndex({
        counselor: 1,
        status: 1,
        createdAt: -1
      });

      console.log('✅ 복합 인덱스 생성 완료');
    }
  },
  {
    version: '1.2.0',
    description: '알림 시스템 최적화',
    up: async () => {
      console.log('🔔 알림 시스템 인덱스 최적화...');

      const db = mongoose.connection.db;

      // 알림 관련 복합 인덱스
      await db.collection('notifications').createIndex({
        user: 1,
        isRead: 1,
        createdAt: -1
      });

      await db.collection('notifications').createIndex({
        type: 1,
        createdAt: -1
      });

      console.log('✅ 알림 인덱스 최적화 완료');
    }
  }
];

// 데이터베이스 연결
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbuddy', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
}

// 실행된 마이그레이션 확인
async function getExecutedMigrations() {
  try {
    const executed = await Migration.find().sort({ version: 1 });
    return executed.map(m => m.version);
  } catch (error) {
    // Migration 컬렉션이 없는 경우 (첫 실행)
    return [];
  }
}

// 마이그레이션 실행
async function runMigrations() {
  console.log('🚀 마이그레이션 시작...');

  const executedVersions = await getExecutedMigrations();
  console.log('📋 실행된 마이그레이션:', executedVersions);

  for (const migration of migrations) {
    if (!executedVersions.includes(migration.version)) {
      console.log(`\n🔄 마이그레이션 ${migration.version} 실행 중...`);
      console.log(`📝 ${migration.description}`);

      try {
        await migration.up();

        // 마이그레이션 기록 저장
        const migrationRecord = new Migration({
          version: migration.version,
          description: migration.description
        });
        await migrationRecord.save();

        console.log(`✅ 마이그레이션 ${migration.version} 완료`);
      } catch (error) {
        console.error(`❌ 마이그레이션 ${migration.version} 실패:`, error);
        throw error;
      }
    } else {
      console.log(`⏭️  마이그레이션 ${migration.version} 이미 실행됨`);
    }
  }

  console.log('\n🎉 모든 마이그레이션 완료');
}

// 마이그레이션 상태 확인
async function checkMigrationStatus() {
  console.log('\n📊 마이그레이션 상태:');

  const executed = await Migration.find().sort({ version: 1 });

  if (executed.length === 0) {
    console.log('   실행된 마이그레이션이 없습니다.');
  } else {
    executed.forEach(migration => {
      console.log(`   ✅ ${migration.version}: ${migration.description} (${migration.executedAt.toISOString()})`);
    });
  }

  const pendingMigrations = migrations.filter(m =>
    !executed.some(e => e.version === m.version)
  );

  if (pendingMigrations.length > 0) {
    console.log('\n⏳ 대기 중인 마이그레이션:');
    pendingMigrations.forEach(migration => {
      console.log(`   🔄 ${migration.version}: ${migration.description}`);
    });
  } else {
    console.log('\n✅ 모든 마이그레이션이 최신 상태입니다.');
  }
}

// 메인 실행 함수
async function main() {
  const command = process.argv[2];

  await connectDB();

  switch (command) {
  case 'status':
    await checkMigrationStatus();
    break;
  case 'run':
  default:
    await runMigrations();
    await checkMigrationStatus();
    break;
  }

  process.exit(0);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  });
}

module.exports = {
  connectDB,
  runMigrations,
  checkMigrationStatus
};
