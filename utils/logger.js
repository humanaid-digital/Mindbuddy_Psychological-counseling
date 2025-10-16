const fs = require('fs');
const path = require('path');

/**
 * 간단한 로깅 시스템
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}\n`;
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('info', message, meta);
    console.log(formatted.trim());
    this.writeToFile('app.log', formatted);
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('error', message, meta);
    console.error(formatted.trim());
    this.writeToFile('error.log', formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(formatted.trim());
    this.writeToFile('app.log', formatted);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('debug', message, meta);
      console.log(formatted.trim());
      this.writeToFile('debug.log', formatted);
    }
  }

  // HTTP 요청 로깅 미들웨어
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        if (res.statusCode >= 400) {
          this.error(`HTTP ${req.method} ${req.originalUrl}`, logData);
        } else {
          this.info(`HTTP ${req.method} ${req.originalUrl}`, logData);
        }
      });
      
      next();
    };
  }
}

module.exports = new Logger();