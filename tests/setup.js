const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// 테스트 시작 전 설정
beforeAll(async () => {
  // 메모리 내 MongoDB 서버 시작
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Mongoose 연결
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// 각 테스트 후 데이터베이스 정리
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// 테스트 종료 후 정리
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mindbuddy-test';
