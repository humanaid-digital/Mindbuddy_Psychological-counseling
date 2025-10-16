const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB 연결 설정
 */
class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // 최대 연결 풀 크기
        serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
        socketTimeoutMS: 45000 // 소켓 타임아웃
      };

      this.connection = await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbuddy',
        options
      );

      logger.info('MongoDB 연결 성공', {
        host: this.connection.connection.host,
        port: this.connection.connection.port,
        database: this.connection.connection.name
      });

      // 연결 이벤트 리스너 설정
      this.setupEventListeners();

      return this.connection;
    } catch (error) {
      logger.error('MongoDB 연결 실패', { error: error.message });
      throw error;
    }
  }

  setupEventListeners() {
    const db = mongoose.connection;

    db.on('error', (error) => {
      logger.error('MongoDB 연결 오류', { error: error.message });
    });

    db.on('disconnected', () => {
      logger.warn('MongoDB 연결 해제됨');
    });

    db.on('reconnected', () => {
      logger.info('MongoDB 재연결됨');
    });

    // 프로세스 종료 시 연결 정리
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB 연결이 정상적으로 종료되었습니다.');
    } catch (error) {
      logger.error('MongoDB 연결 종료 중 오류 발생', { error: error.message });
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();