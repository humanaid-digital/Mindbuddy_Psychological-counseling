const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { cache } = require('../utils/cache');

/**
 * 기본 헬스 체크
 */
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {}
    };

    // PostgreSQL 연결 상태 확인
    try {
      if (database.isConnected()) {
        await database.query('SELECT 1');
        healthCheck.services.database = { status: 'healthy', type: 'postgresql' };
      } else {
        healthCheck.services.database = { status: 'disconnected', type: 'postgresql' };
      }
    } catch (error) {
      healthCheck.services.database = { 
        status: 'unhealthy', 
        type: 'postgresql',
        error: error.message 
      };
    }

    // Redis 연결 상태 확인
    try {
      if (cache.isConnected) {
        // Redis ping 테스트
        await cache.client.ping();
        healthCheck.services.redis = { status: 'healthy', type: 'redis' };
      } else {
        healthCheck.services.redis = { status: 'disconnected', type: 'redis' };
      }
    } catch (error) {
      healthCheck.services.redis = { 
        status: 'unhealthy', 
        type: 'redis',
        error: error.message 
      };
    }

    // 전체 상태 결정
    const allServicesHealthy = Object.values(healthCheck.services)
      .every(service => service.status === 'healthy');
    
    if (!allServicesHealthy) {
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * 상세 헬스 체크 (메모리, CPU 등)
 */
router.get('/detailed', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      system: {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      services: {}
    };

    // 서비스 상태 확인 (기본 헬스 체크와 동일)
    try {
      if (database.isConnected()) {
        await database.query('SELECT 1');
        detailedHealth.services.database = { status: 'healthy', type: 'postgresql' };
      } else {
        detailedHealth.services.database = { status: 'disconnected', type: 'postgresql' };
      }
    } catch (error) {
      detailedHealth.services.database = { 
        status: 'unhealthy', 
        type: 'postgresql',
        error: error.message 
      };
    }

    try {
      if (cache.isConnected) {
        // Redis ping 테스트
        await cache.client.ping();
        detailedHealth.services.redis = { status: 'healthy', type: 'redis' };
      } else {
        detailedHealth.services.redis = { status: 'disconnected', type: 'redis' };
      }
    } catch (error) {
      detailedHealth.services.redis = { 
        status: 'unhealthy', 
        type: 'redis',
        error: error.message 
      };
    }

    const allServicesHealthy = Object.values(detailedHealth.services)
      .every(service => service.status === 'healthy');
    
    if (!allServicesHealthy) {
      detailedHealth.status = 'degraded';
    }

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * 준비 상태 확인 (Kubernetes readiness probe용)
 */
router.get('/ready', async (req, res) => {
  try {
    // 필수 서비스들이 준비되었는지 확인
    const isReady = database.isConnected();
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not connected'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * 생존 상태 확인 (Kubernetes liveness probe용)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;