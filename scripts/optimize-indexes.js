const mongoose = require('mongoose');
require('dotenv').config();

/**
 * 데이터베이스 인덱스 최적화 스크립트
 */

async function optimizeIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 데이터베이스 연결 성공');

    const db = mongoose.connection.db;

    // 1. Users 컬렉션 인덱스 최적화
    console.log('👥 Users 인덱스 최적화 중...');
    await db.collection('users').createIndex({ email: 1, isActive: 1 });
    await db.collection('users').createIndex({ role: 1, isActive: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    await db.collection('users').createIndex({ 'concerns': 1, 'preferredMethod': 1 });

    // 2. Counselors 컬렉션 인덱스 최적화
    console.log('🧠 Counselors 인덱스 최적화 중...');
    await db.collection('counselors').createIndex({ 
      'specialties': 1, 
      'rating.average': -1, 
      'fee': 1,
      'status': 1 
    });
    await db.collection('counselors').createIndex({ user: 1, status: 1 });
    await db.collection('counselors').createIndex({ status: 1, isActive: 1 });
    await db.collection('counselors').createIndex({ 'rating.average': -1, fee: 1 });

    // 3. Bookings 컬렉션 인덱스 최적화
    console.log('📅 Bookings 인덱스 최적화 중...');
    await db.collection('bookings').createIndex({ 
      counselor: 1, 
      date: 1, 
      status: 1 
    });
    await db.collection('bookings').createIndex({ 
      client: 1, 
      createdAt: -1 
    });
    await db.collection('bookings').createIndex({ 
      date: 1, 
      startTime: 1, 
      endTime: 1 
    });
    await db.collection('bookings').createIndex({ 
      status: 1, 
      paymentStatus: 1 
    });
    try {
      await db.collection('bookings').createIndex({ sessionId: 1 }, { name: 'sessionId_booking_1' });
    } catch (error) {
      if (error.code !== 86) {
        throw error;
      }
      console.log('  - sessionId 인덱스 이미 존재함');
    }

    // 4. Reviews 컬렉션 인덱스 최적화
    console.log('⭐ Reviews 인덱스 최적화 중...');
    await db.collection('reviews').createIndex({ 
      counselor: 1, 
      createdAt: -1 
    });
    await db.collection('reviews').createIndex({ 
      client: 1, 
      createdAt: -1 
    });
    await db.collection('reviews').createIndex({ rating: -1 });

    // 5. Notifications 컬렉션 인덱스 최적화
    console.log('🔔 Notifications 인덱스 최적화 중...');
    await db.collection('notifications').createIndex({ 
      recipient: 1, 
      isRead: 1, 
      createdAt: -1 
    });
    await db.collection('notifications').createIndex({ 
      type: 1, 
      createdAt: -1 
    });

    // 6. ChatMessages 컬렉션 인덱스 최적화
    console.log('💬 ChatMessages 인덱스 최적화 중...');
    try {
      await db.collection('chatmessages').createIndex({ 
        sessionId: 1, 
        createdAt: 1 
      }, { name: 'sessionId_createdAt_1' });
    } catch (error) {
      if (error.code !== 86) { // 86 = IndexKeySpecsConflict
        throw error;
      }
      console.log('  - sessionId 인덱스 이미 존재함');
    }
    
    try {
      await db.collection('chatmessages').createIndex({ 
        sender: 1, 
        createdAt: -1 
      });
    } catch (error) {
      if (error.code !== 86) {
        throw error;
      }
      console.log('  - sender 인덱스 이미 존재함');
    }

    // 7. Payments 컬렉션 인덱스 최적화
    console.log('💳 Payments 인덱스 최적화 중...');
    await db.collection('payments').createIndex({ 
      booking: 1, 
      status: 1 
    });
    await db.collection('payments').createIndex({ 
      user: 1, 
      createdAt: -1 
    });
    await db.collection('payments').createIndex({ 
      status: 1, 
      createdAt: -1 
    });

    console.log('✅ 모든 인덱스 최적화 완료!');

    // 인덱스 사용량 분석
    console.log('\n📈 인덱스 사용량 분석:');
    const collections = ['users', 'counselors', 'bookings', 'reviews', 'notifications', 'chatmessages', 'payments'];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`${collectionName}: ${indexes.length}개 인덱스`);
    }

  } catch (error) {
    console.error('❌ 인덱스 최적화 실패:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  optimizeIndexes();
}

module.exports = { optimizeIndexes };