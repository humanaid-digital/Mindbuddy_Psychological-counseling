const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Service discovery configuration
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    healthCheck: '/health'
  },
  booking: {
    url: process.env.BOOKING_SERVICE_URL || 'http://localhost:3002',
    healthCheck: '/health'
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
    healthCheck: '/health'
  },
  payment: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    healthCheck: '/health'
  },
  counselor: {
    url: process.env.COUNSELOR_SERVICE_URL || 'http://localhost:3005',
    healthCheck: '/health'
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: Object.keys(services)
  });
});

// Service health monitoring
const checkServiceHealth = async (serviceName, serviceConfig) => {
  try {
    const response = await fetch(`${serviceConfig.url}${serviceConfig.healthCheck}`);
    return response.ok;
  } catch (error) {
    console.error(`Service ${serviceName} health check failed:`, error.message);
    return false;
  }
};

// Load balancing for multiple instances
const loadBalance = (instances) => {
  let currentIndex = 0;
  return () => {
    const instance = instances[currentIndex];
    currentIndex = (currentIndex + 1) % instances.length;
    return instance;
  };
};

// Circuit breaker pattern
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Create circuit breakers for each service
const circuitBreakers = {};
Object.keys(services).forEach(serviceName => {
  circuitBreakers[serviceName] = new CircuitBreaker();
});

// Proxy configuration with circuit breaker
const createServiceProxy = (serviceName, serviceConfig) => {
  return createProxyMiddleware({
    target: serviceConfig.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/${serviceName}`]: ''
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add request ID for tracing
      const requestId = req.headers['x-request-id'] || 
        Math.random().toString(36).substring(2, 15);
      proxyReq.setHeader('x-request-id', requestId);
      
      // Forward user information
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.userId);
        proxyReq.setHeader('x-user-role', req.user.role || 'client');
      }
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, err.message);
      res.status(503).json({
        success: false,
        message: `Service ${serviceName} is temporarily unavailable`,
        error: 'SERVICE_UNAVAILABLE'
      });
    }
  });
};

// Route definitions with authentication
app.use('/api/auth', createServiceProxy('auth', services.auth));

app.use('/api/counselors', createServiceProxy('counselor', services.counselor));

app.use('/api/bookings', authenticateToken, createServiceProxy('booking', services.booking));

app.use('/api/notifications', authenticateToken, createServiceProxy('notification', services.notification));

app.use('/api/payments', authenticateToken, createServiceProxy('payment', services.payment));

// API versioning support
app.use('/api/v1/auth', createServiceProxy('auth', services.auth));
app.use('/api/v1/counselors', createServiceProxy('counselor', services.counselor));
app.use('/api/v1/bookings', authenticateToken, createServiceProxy('booking', services.booking));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Gateway error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal gateway error',
    requestId: req.headers['x-request-id']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.GATEWAY_PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📋 Available services: ${Object.keys(services).join(', ')}`);
  
  // Periodic health checks
  setInterval(async () => {
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      const isHealthy = await checkServiceHealth(serviceName, serviceConfig);
      if (!isHealthy) {
        console.warn(`⚠️  Service ${serviceName} is unhealthy`);
      }
    }
  }, 30000); // Check every 30 seconds
});

module.exports = app;