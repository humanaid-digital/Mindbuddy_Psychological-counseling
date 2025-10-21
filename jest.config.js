module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: process.env.CI ? 60000 : 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  detectOpenHandles: process.env.CI ? false : true,
  maxWorkers: process.env.CI ? 1 : '50%',
  workerIdleMemoryLimit: process.env.CI ? '256MB' : '2GB',
  // CI 환경에서 추가 설정
  ...(process.env.CI && {
    bail: false,
    cache: false,
    watchman: false,
    runInBand: true
  })
};
