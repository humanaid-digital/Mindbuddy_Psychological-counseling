const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

/**
 * 성능 테스트 스크립트
 * 새로운 프로젝트 구조에서 부하 테스트 실행
 */

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.concurrentRequests = 0;
    this.maxConcurrentRequests = 0;
  }

  /**
   * HTTP 요청 실행
   */
  async makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PerformanceTester/1.0',
          ...headers
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const startTime = performance.now();
      this.concurrentRequests++;
      this.maxConcurrentRequests = Math.max(this.maxConcurrentRequests, this.concurrentRequests);

      const req = httpModule.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;

          this.concurrentRequests--;

          resolve({
            statusCode: res.statusCode,
            responseTime,
            contentLength: responseData.length,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        this.concurrentRequests--;
        reject(error);
      });

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * 단일 엔드포인트 테스트
   */
  async testEndpoint(name, path, method = 'GET', data = null, headers = {}, iterations = 100) {
    console.log(`\n🧪 Testing ${name} (${method} ${path})`);
    console.log(`📊 Iterations: ${iterations}`);

    const results = [];
    const errors = [];
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.makeRequest(path, method, data, headers);
        results.push(result);

        if (i % 10 === 0) {
          process.stdout.write(`\r⏳ Progress: ${i + 1}/${iterations} (${Math.round((i + 1) / iterations * 100)}%)`);
        }
      } catch (error) {
        errors.push(error);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // 통계 계산
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const successRate = (results.length / iterations) * 100;
    const requestsPerSecond = (results.length / totalTime) * 1000;

    // 백분위수 계산
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    const testResult = {
      name,
      path,
      method,
      iterations,
      successCount: results.length,
      errorCount: errors.length,
      successRate,
      totalTime,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      percentiles: { p50, p90, p95, p99 },
      statusCodes: this.getStatusCodeDistribution(results),
      errors: errors.map(e => e.message)
    };

    this.results.push(testResult);
    this.printTestResult(testResult);

    return testResult;
  }

  /**
   * 동시 요청 테스트
   */
  async testConcurrentRequests(name, path, method = 'GET', data = null, headers = {}, concurrency = 10, totalRequests = 100) {
    console.log(`\n🚀 Concurrent Test: ${name} (${method} ${path})`);
    console.log(`📊 Concurrency: ${concurrency}, Total Requests: ${totalRequests}`);

    const results = [];
    const errors = [];
    const startTime = performance.now();

    // 동시 요청 배치 생성
    const batches = [];
    for (let i = 0; i < totalRequests; i += concurrency) {
      const batchSize = Math.min(concurrency, totalRequests - i);
      const batch = Array(batchSize).fill().map(() =>
        this.makeRequest(path, method, data, headers)
          .catch(error => ({ error }))
      );
      batches.push(batch);
    }

    // 배치별로 실행
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await Promise.all(batches[i]);

      batchResults.forEach(result => {
        if (result.error) {
          errors.push(result.error);
        } else {
          results.push(result);
        }
      });

      process.stdout.write(`\r⏳ Progress: ${Math.min((i + 1) * concurrency, totalRequests)}/${totalRequests}`);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // 통계 계산 (이전과 동일)
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const successRate = (results.length / totalRequests) * 100;
    const requestsPerSecond = (results.length / totalTime) * 1000;

    const testResult = {
      name: `${name} (Concurrent)`,
      path,
      method,
      concurrency,
      totalRequests,
      successCount: results.length,
      errorCount: errors.length,
      successRate,
      totalTime,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      maxConcurrentRequests: this.maxConcurrentRequests,
      statusCodes: this.getStatusCodeDistribution(results),
      errors: errors.map(e => e.message || e.toString())
    };

    this.results.push(testResult);
    this.printConcurrentTestResult(testResult);

    return testResult;
  }

  /**
   * 상태 코드 분포 계산
   */
  getStatusCodeDistribution(results) {
    const distribution = {};
    results.forEach(result => {
      const code = result.statusCode;
      distribution[code] = (distribution[code] || 0) + 1;
    });
    return distribution;
  }

  /**
   * 테스트 결과 출력
   */
  printTestResult(result) {
    console.log(`\n\n📈 Results for ${result.name}:`);
    console.log(`✅ Success Rate: ${result.successRate.toFixed(2)}% (${result.successCount}/${result.iterations})`);
    console.log(`⚡ Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
    console.log('⏱️  Response Times:');
    console.log(`   Average: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`   Max: ${result.maxResponseTime.toFixed(2)}ms`);
    console.log('📊 Percentiles:');
    console.log(`   50th: ${result.percentiles.p50.toFixed(2)}ms`);
    console.log(`   90th: ${result.percentiles.p90.toFixed(2)}ms`);
    console.log(`   95th: ${result.percentiles.p95.toFixed(2)}ms`);
    console.log(`   99th: ${result.percentiles.p99.toFixed(2)}ms`);
    console.log('🔢 Status Codes:', result.statusCodes);

    if (result.errors.length > 0) {
      console.log(`❌ Errors (${result.errors.length}):`, result.errors.slice(0, 5));
    }
  }

  /**
   * 동시 요청 테스트 결과 출력
   */
  printConcurrentTestResult(result) {
    console.log(`\n\n📈 Concurrent Results for ${result.name}:`);
    console.log(`🔄 Concurrency: ${result.concurrency}, Max Concurrent: ${result.maxConcurrentRequests}`);
    console.log(`✅ Success Rate: ${result.successRate.toFixed(2)}% (${result.successCount}/${result.totalRequests})`);
    console.log(`⚡ Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);
    console.log('⏱️  Response Times:');
    console.log(`   Average: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`   Min: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`   Max: ${result.maxResponseTime.toFixed(2)}ms`);
    console.log('🔢 Status Codes:', result.statusCodes);

    if (result.errors.length > 0) {
      console.log(`❌ Errors (${result.errors.length}):`, result.errors.slice(0, 5));
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Tests for MindBuddy Platform');
    console.log('=' .repeat(60));

    try {
      // 1. 헬스체크 테스트
      await this.testEndpoint('Health Check', '/health', 'GET', null, {}, 50);

      // 2. 정적 파일 테스트
      await this.testEndpoint('Static File (Index)', '/', 'GET', null, {}, 30);

      // 3. API 엔드포인트 테스트
      await this.testEndpoint('Counselors List', '/api/counselors', 'GET', null, {}, 50);

      // 4. 인증 테스트 (실패 케이스)
      await this.testEndpoint('Auth Me (No Token)', '/api/auth/me', 'GET', null, {}, 30);

      // 5. 동시 요청 테스트
      await this.testConcurrentRequests('Health Check Concurrent', '/health', 'GET', null, {}, 10, 50);
      await this.testConcurrentRequests('Counselors Concurrent', '/api/counselors', 'GET', null, {}, 5, 25);

      // 6. 부하 테스트
      console.log('\n🔥 Load Testing...');
      await this.testConcurrentRequests('High Load Test', '/health', 'GET', null, {}, 20, 100);

      this.printSummary();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
  }

  /**
   * 테스트 요약 출력
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.results.length;
    const totalRequests = this.results.reduce((sum, r) => sum + (r.iterations || r.totalRequests), 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successCount, 0);
    const totalErrors = this.results.reduce((sum, r) => sum + r.errorCount, 0);
    const avgSuccessRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / totalTests;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / totalTests;
    const avgRequestsPerSecond = this.results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / totalTests;

    console.log(`📈 Total Tests: ${totalTests}`);
    console.log(`📊 Total Requests: ${totalRequests}`);
    console.log(`✅ Successful Requests: ${totalSuccessful}`);
    console.log(`❌ Failed Requests: ${totalErrors}`);
    console.log(`📊 Average Success Rate: ${avgSuccessRate.toFixed(2)}%`);
    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`⚡ Average Requests/sec: ${avgRequestsPerSecond.toFixed(2)}`);

    // 성능 등급 평가
    console.log('\n🏆 Performance Grade:');
    if (avgResponseTime < 100 && avgSuccessRate > 99) {
      console.log('🥇 EXCELLENT - Response time < 100ms, Success rate > 99%');
    } else if (avgResponseTime < 200 && avgSuccessRate > 95) {
      console.log('🥈 GOOD - Response time < 200ms, Success rate > 95%');
    } else if (avgResponseTime < 500 && avgSuccessRate > 90) {
      console.log('🥉 FAIR - Response time < 500ms, Success rate > 90%');
    } else {
      console.log('⚠️  NEEDS IMPROVEMENT - Consider optimization');
    }

    // 권장사항
    console.log('\n💡 Recommendations:');
    if (avgResponseTime > 200) {
      console.log('- Consider adding caching for frequently accessed data');
      console.log('- Optimize database queries with proper indexing');
    }
    if (avgSuccessRate < 95) {
      console.log('- Investigate error causes and improve error handling');
      console.log('- Consider implementing circuit breakers for external dependencies');
    }
    if (avgRequestsPerSecond < 50) {
      console.log('- Consider horizontal scaling or load balancing');
      console.log('- Optimize application performance and resource usage');
    }

    console.log('\n✨ Test completed successfully!');
  }

  /**
   * 결과를 JSON 파일로 저장
   */
  saveResults(filename = 'performance-test-results.json') {
    const fs = require('fs');
    const path = require('path');

    const resultsDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filePath = path.join(resultsDir, filename);
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        totalRequests: this.results.reduce((sum, r) => sum + (r.iterations || r.totalRequests), 0),
        totalSuccessful: this.results.reduce((sum, r) => sum + r.successCount, 0),
        totalErrors: this.results.reduce((sum, r) => sum + r.errorCount, 0)
      },
      results: this.results
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Results saved to: ${filePath}`);
  }
}

// 스크립트 실행
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:5000';
  const tester = new PerformanceTester(baseUrl);

  tester.runAllTests()
    .then(() => {
      tester.saveResults();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;
