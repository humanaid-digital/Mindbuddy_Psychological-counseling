const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const router = express.Router();

// @route   GET /health
// @desc    헬스체크 엔드포인트
// @access  Public
router.get('/', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      memory: 'unknown',
      disk: 'unknown'
    }
  };

  try {
    // 데이터베이스 연결 상태 확인
    if (mongoose.connection.readyState === 1) {
      healthCheck.checks.database = 'healthy';
    } else {
      healthCheck.checks.database = 'unhealthy';
    }

    // 메모리 사용량 확인
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    healthCheck.checks.memory = {
      status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
      usage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      system: {
        total: Math.round(totalMemory / 1024 / 1024 / 1024) + ' GB',
        free: Math.round(freeMemory / 1024 / 1024 / 1024) + ' GB',
        usagePercent: Math.round(memoryUsagePercent) + '%'
      }
    };

    // CPU 정보
    const cpuUsage = process.cpuUsage();
    healthCheck.checks.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: os.loadavg()
    };

    // 전체 상태 결정
    const isHealthy =
      healthCheck.checks.database === 'healthy' &&
      (healthCheck.checks.memory.status === 'healthy' || healthCheck.checks.memory.status === 'warning');

    if (isHealthy) {
      res.status(200).json({
        success: true,
        ...healthCheck
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Service Unavailable',
        ...healthCheck
      });
    }

  } catch (error) {
    healthCheck.checks.database = 'error';
    healthCheck.message = 'Error';

    res.status(503).json({
      success: false,
      ...healthCheck,
      error: error.message
    });
  }
});

// @route   GET /health/ready
// @desc    준비 상태 확인 (Kubernetes readiness probe용)
// @access  Public
router.get('/ready', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not ready'
      });
    }

    // 간단한 데이터베이스 쿼리 테스트
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      success: true,
      message: 'Ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /health/live
// @desc    생존 상태 확인 (Kubernetes liveness probe용)
// @access  Public
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
