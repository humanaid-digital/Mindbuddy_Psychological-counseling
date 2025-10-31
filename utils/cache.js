const redis = require('redis');
const logger = require('./logger');

/**
 * Redis 캐싱 유틸리티
 */

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis 서버 연결 거부됨');
            return new Error('Redis 서버에 연결할 수 없습니다');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('재시도 시간 초과');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis 클라이언트 오류:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis 연결 성공');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis 클라이언트 준비 완료');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis 연결 실패:', error);
      this.isConnected = false;
    }
  }

  /**
   * 캐시에서 데이터 조회
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(key);
      if (data) {
        logger.debug(`캐시 히트: ${key}`);
        return JSON.parse(data);
      }
      logger.debug(`캐시 미스: ${key}`);
      return null;
    } catch (error) {
      logger.error(`캐시 조회 오류 (${key}):`, error);
      return null;
    }
  }

  /**
   * 캐시에 데이터 저장
   */
  async set(key, data, ttl = 300) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(data));
      logger.debug(`캐시 저장: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`캐시 저장 오류 (${key}):`, error);
      return false;
    }
  }

  /**
   * 캐시 삭제
   */
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      logger.debug(`캐시 삭제: ${key}`);
      return true;
    } catch (error) {
      logger.error(`캐시 삭제 오류 (${key}):`, error);
      return false;
    }
  }

  /**
   * 패턴으로 캐시 삭제
   */
  async delPattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug(`패턴 캐시 삭제: ${pattern} (${keys.length}개)`);
      }
      return true;
    } catch (error) {
      logger.error(`패턴 캐시 삭제 오류 (${pattern}):`, error);
      return false;
    }
  }

  /**
   * 캐시 통계
   */
  async getStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('stats');
      return {
        hits: this.extractStat(info, 'keyspace_hits'),
        misses: this.extractStat(info, 'keyspace_misses'),
        keys: await this.client.dbSize()
      };
    } catch (error) {
      logger.error('캐시 통계 조회 오류:', error);
      return null;
    }
  }

  extractStat(info, statName) {
    const match = info.match(new RegExp(`${statName}:(\\d+)`));
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 연결 종료
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis 연결 종료');
    }
  }
}

// 캐시 키 생성 헬퍼
const CacheKeys = {
  counselors: (filters = {}) => {
    const filterStr = Object.keys(filters).length > 0 
      ? `:${Buffer.from(JSON.stringify(filters)).toString('base64')}` 
      : '';
    return `counselors:list${filterStr}`;
  },
  counselor: (id) => `counselor:${id}`,
  userSessions: (userId) => `user:${userId}:sessions`,
  bookings: (userId, type) => `bookings:${type}:${userId}`,
  reviews: (counselorId) => `reviews:${counselorId}`,
  stats: (type, period) => `stats:${type}:${period}`,
  availability: (counselorId, date) => `availability:${counselorId}:${date}`
};

// 싱글톤 인스턴스
const cacheService = new CacheService();

module.exports = {
  CacheService,
  CacheKeys,
  cache: cacheService
};