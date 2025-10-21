const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing';

// CI 환경에서는 더 긴 타임아웃 설정
const timeout = process.env.CI ? 60000 : 30000;

// 테스트 시작 전 설정
beforeAll(async () => {
  try {
    // CI 환경에서는 외부 MongoDB 사용, 로컬에서는 메모리 서버 사용
    if (process.env.CI && process.env.MONGODB_URI) {
      console.log('Using external MongoDB for CI:', process.env.MONGODB_URI);
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000
      });
    } else {
      console.log('Starting MongoDB Memory Server for local testing...');
      mongod = await MongoMemoryServer.create({
        binary: {
          downloadDir: './mongodb-binaries',
          version: '4.4.18'
        },
        instance: {
          dbName: 'mindbuddy-test'
        }
      });
      const uri = mongod.getUri();
      console.log('MongoDB Memory Server URI:', uri);

      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    console.log('MongoDB connected successfully for tests');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}, timeout);

// 각 테스트 후 데이터베이스 정리
afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      const promises = Object.keys(collections).map(key =>
        collections[key].deleteMany({})
      );
      await Promise.all(promises);
    }
  } catch (error) {
    console.warn('Error cleaning up collections:', error.message);
  }
});

// 테스트 종료 후 정리
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    if (mongod) {
      await mongod.stop();
      console.log('MongoDB Memory Server stopped');
    }
  } catch (error) {
    console.warn('Error during cleanup:', error.message);
  }
}, timeout);
