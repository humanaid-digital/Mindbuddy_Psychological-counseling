const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * PostgreSQL 연결 설정
 */
class Database {
  constructor() {
    this.sequelize = null;
  }

  async connect() {
    try {
      // PostgreSQL 연결 설정
      this.sequelize = new Sequelize(process.env.DATABASE_URL || {
        database: process.env.DB_NAME || 'mindbuddy',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
          } : false
        }
      });

      // 연결 테스트
      await this.sequelize.authenticate();
      
      logger.info('PostgreSQL 연결 성공', {
        host: this.sequelize.config.host,
        port: this.sequelize.config.port,
        database: this.sequelize.config.database
      });

      // 모델 동기화 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        await this.sequelize.sync({ alter: true });
        logger.info('데이터베이스 스키마 동기화 완료');
      }

      // 이벤트 리스너 설정
      this.setupEventListeners();

      return this.sequelize;
    } catch (error) {
      logger.error('PostgreSQL 연결 실패', { error: error.message });
      throw error;
    }
  }

  setupEventListeners() {
    // 프로세스 종료 시 연결 정리
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        logger.info('PostgreSQL 연결이 정상적으로 종료되었습니다.');
      }
    } catch (error) {
      logger.error('PostgreSQL 연결 종료 중 오류 발생', { error: error.message });
    }
  }

  getConnection() {
    return this.sequelize;
  }

  isConnected() {
    return this.sequelize && !this.sequelize.connectionManager.pool._draining;
  }

  async query(sql, options = {}) {
    try {
      return await this.sequelize.query(sql, {
        type: Sequelize.QueryTypes.SELECT,
        ...options
      });
    } catch (error) {
      logger.error('쿼리 실행 실패', { error: error.message });
      throw error;
    }
  }
}

module.exports = new Database();