const fs = require('fs');
const path = require('path');

/**
 * 프로덕션 환경 성능 모니터링 설정 스크립트
 * 지속적인 모니터링을 위한 설정 및 도구 구성
 */

class MonitoringSetup {
  constructor() {
    this.configDir = path.join(__dirname, '..', 'config');
    this.monitoringDir = path.join(__dirname, '..', 'monitoring');
    this.alertsDir = path.join(this.monitoringDir, 'alerts');
    this.dashboardsDir = path.join(this.monitoringDir, 'dashboards');
  }

  /**
   * 모니터링 디렉토리 구조 생성
   */
  createDirectories() {
    const directories = [
      this.monitoringDir,
      this.alertsDir,
      this.dashboardsDir,
      path.join(this.monitoringDir, 'scripts'),
      path.join(this.monitoringDir, 'configs')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  /**
   * Prometheus 설정 파일 생성
   */
  createPrometheusConfig() {
    const prometheusConfig = `
# Prometheus 설정 파일
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # MindBuddy 애플리케이션 메트릭
  - job_name: 'mindbuddy-app'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Node.js 애플리케이션 메트릭
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  # MongoDB 메트릭
  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['localhost:9216']

  # Nginx 메트릭 (리버스 프록시)
  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['localhost:9113']
`;

    const configPath = path.join(this.monitoringDir, 'configs', 'prometheus.yml');
    fs.writeFileSync(configPath, prometheusConfig.trim());
    console.log(`✅ Created Prometheus config: ${configPath}`);
  }

  /**
   * Grafana 대시보드 설정
   */
  createGrafanaDashboard() {
    const dashboardConfig = {
      "dashboard": {
        "id": null,
        "title": "MindBuddy Performance Dashboard",
        "tags": ["mindbuddy", "performance", "monitoring"],
        "timezone": "Asia/Seoul",
        "panels": [
          {
            "id": 1,
            "title": "응답 시간",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "95th percentile"
              },
              {
                "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "50th percentile"
              }
            ],
            "yAxes": [
              {
                "label": "시간 (초)",
                "min": 0
              }
            ]
          },
          {
            "id": 2,
            "title": "초당 요청 수 (RPS)",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])",
                "legendFormat": "{{method}} {{route}}"
              }
            ]
          },
          {
            "id": 3,
            "title": "에러율",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total{status=~\"4..|5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
                "legendFormat": "에러율 (%)"
              }
            ]
          },
          {
            "id": 4,
            "title": "메모리 사용량",
            "type": "graph",
            "targets": [
              {
                "expr": "process_resident_memory_bytes / 1024 / 1024",
                "legendFormat": "메모리 사용량 (MB)"
              }
            ]
          },
          {
            "id": 5,
            "title": "CPU 사용률",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(process_cpu_seconds_total[5m]) * 100",
                "legendFormat": "CPU 사용률 (%)"
              }
            ]
          },
          {
            "id": 6,
            "title": "활성 연결 수",
            "type": "singlestat",
            "targets": [
              {
                "expr": "nodejs_active_handles_total",
                "legendFormat": "활성 핸들"
              }
            ]
          }
        ],
        "time": {
          "from": "now-1h",
          "to": "now"
        },
        "refresh": "5s"
      }
    };

    const dashboardPath = path.join(this.dashboardsDir, 'mindbuddy-dashboard.json');
    fs.writeFileSync(dashboardPath, JSON.stringify(dashboardConfig, null, 2));
    console.log(`✅ Created Grafana dashboard: ${dashboardPath}`);
  }

  /**
   * 알림 규칙 설정
   */
  createAlertRules() {
    const alertRules = `
groups:
  - name: mindbuddy-alerts
    rules:
      # 높은 응답 시간 알림
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "높은 응답 시간 감지"
          description: "95th percentile 응답 시간이 1초를 초과했습니다: {{ $value }}초"

      # 높은 에러율 알림
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"4..|5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "높은 에러율 감지"
          description: "에러율이 5%를 초과했습니다: {{ $value }}%"

      # 메모리 사용량 알림
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 512
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "높은 메모리 사용량"
          description: "메모리 사용량이 512MB를 초과했습니다: {{ $value }}MB"

      # CPU 사용률 알림
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) * 100 > 80
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "높은 CPU 사용률"
          description: "CPU 사용률이 80%를 초과했습니다: {{ $value }}%"

      # 서비스 다운 알림
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "서비스 다운"
          description: "{{ $labels.job }} 서비스가 다운되었습니다"

      # 데이터베이스 연결 실패
      - alert: DatabaseConnectionFailed
        expr: mongodb_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "데이터베이스 연결 실패"
          description: "MongoDB 연결이 실패했습니다"
`;

    const alertPath = path.join(this.monitoringDir, 'configs', 'alert_rules.yml');
    fs.writeFileSync(alertPath, alertRules.trim());
    console.log(`✅ Created alert rules: ${alertPath}`);
  }

  /**
   * Docker Compose 모니터링 스택
   */
  createMonitoringStack() {
    const dockerCompose = `
version: '3.8'

services:
  # Prometheus - 메트릭 수집
  prometheus:
    image: prom/prometheus:latest
    container_name: mindbuddy-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/configs/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/configs/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  # Grafana - 시각화 대시보드
  grafana:
    image: grafana/grafana:latest
    container_name: mindbuddy-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123!
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - monitoring

  # AlertManager - 알림 관리
  alertmanager:
    image: prom/alertmanager:latest
    container_name: mindbuddy-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/configs/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    networks:
      - monitoring

  # Node Exporter - 시스템 메트릭
  node-exporter:
    image: prom/node-exporter:latest
    container_name: mindbuddy-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  # MongoDB Exporter - MongoDB 메트릭
  mongodb-exporter:
    image: percona/mongodb_exporter:latest
    container_name: mindbuddy-mongodb-exporter
    ports:
      - "9216:9216"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017
    networks:
      - monitoring
    depends_on:
      - mongodb

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
`;

    const stackPath = path.join(this.monitoringDir, 'docker-compose.monitoring.yml');
    fs.writeFileSync(stackPath, dockerCompose.trim());
    console.log(`✅ Created monitoring stack: ${stackPath}`);
  }

  /**
   * 성능 모니터링 스크립트
   */
  createPerformanceScript() {
    const performanceScript = `#!/bin/bash

# MindBuddy 성능 모니터링 스크립트

echo "🚀 MindBuddy 성능 모니터링 시작..."

# 1. 애플리케이션 상태 확인
echo "📊 애플리케이션 상태 확인..."
curl -s http://localhost:5000/health | jq '.'

# 2. 성능 테스트 실행
echo "⚡ 성능 테스트 실행..."
node ../scripts/performance-test.js http://localhost:5000

# 3. 메트릭 수집
echo "📈 메트릭 수집..."
curl -s http://localhost:5000/metrics > /tmp/mindbuddy-metrics.txt
echo "메트릭이 /tmp/mindbuddy-metrics.txt에 저장되었습니다."

# 4. 로그 분석
echo "📋 최근 에러 로그 확인..."
tail -n 50 ../logs/error.log | grep -i error || echo "에러 없음"

# 5. 리소스 사용량 확인
echo "💾 리소스 사용량 확인..."
echo "메모리 사용량:"
ps aux | grep node | grep -v grep | awk '{print $6/1024 " MB"}'

echo "CPU 사용량:"
ps aux | grep node | grep -v grep | awk '{print $3 "%"}'

# 6. 데이터베이스 상태 확인
echo "🗄️ 데이터베이스 상태 확인..."
mongo --eval "db.runCommand({serverStatus: 1})" --quiet | jq '.connections'

echo "✅ 모니터링 완료!"
`;

    const scriptPath = path.join(this.monitoringDir, 'scripts', 'performance-check.sh');
    fs.writeFileSync(scriptPath, performanceScript.trim());
    fs.chmodSync(scriptPath, '755');
    console.log(`✅ Created performance script: ${scriptPath}`);
  }

  /**
   * 알림 설정 (Slack, Email 등)
   */
  createAlertManagerConfig() {
    const alertManagerConfig = `
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@mindbuddy.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@mindbuddy.com'
        subject: '[MindBuddy] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          알림: {{ .Annotations.summary }}
          설명: {{ .Annotations.description }}
          시간: {{ .StartsAt }}
          {{ end }}
    
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'MindBuddy 알림'
        text: |
          {{ range .Alerts }}
          🚨 {{ .Annotations.summary }}
          📝 {{ .Annotations.description }}
          ⏰ {{ .StartsAt }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
`;

    const configPath = path.join(this.monitoringDir, 'configs', 'alertmanager.yml');
    fs.writeFileSync(configPath, alertManagerConfig.trim());
    console.log(`✅ Created AlertManager config: ${configPath}`);
  }

  /**
   * 모니터링 README 생성
   */
  createMonitoringReadme() {
    const readme = `# MindBuddy 성능 모니터링

## 📊 모니터링 스택

### 구성 요소
- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 시각화 대시보드
- **AlertManager**: 알림 관리
- **Node Exporter**: 시스템 메트릭
- **MongoDB Exporter**: 데이터베이스 메트릭

## 🚀 설정 및 실행

### 1. 모니터링 스택 시작
\`\`\`bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
\`\`\`

### 2. 대시보드 접속
- **Grafana**: http://localhost:3001 (admin/admin123!)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### 3. 성능 테스트 실행
\`\`\`bash
cd monitoring/scripts
./performance-check.sh
\`\`\`

## 📈 주요 메트릭

### 애플리케이션 메트릭
- 응답 시간 (95th, 50th percentile)
- 초당 요청 수 (RPS)
- 에러율
- 활성 연결 수

### 시스템 메트릭
- CPU 사용률
- 메모리 사용량
- 디스크 I/O
- 네트워크 트래픽

### 데이터베이스 메트릭
- 연결 수
- 쿼리 성능
- 인덱스 사용률
- 복제 지연

## 🚨 알림 설정

### 알림 조건
- 응답 시간 > 1초 (2분간)
- 에러율 > 5% (1분간)
- 메모리 사용량 > 512MB (5분간)
- CPU 사용률 > 80% (3분간)
- 서비스 다운 (1분간)

### 알림 채널
- 이메일: admin@mindbuddy.com
- Slack: #alerts 채널
- SMS: 긴급 상황 시

## 🔧 문제 해결

### 일반적인 문제
1. **높은 응답 시간**
   - 데이터베이스 쿼리 최적화
   - 캐싱 적용
   - 로드 밸런싱

2. **높은 메모리 사용량**
   - 메모리 누수 확인
   - 가비지 컬렉션 튜닝
   - 프로세스 재시작

3. **높은 에러율**
   - 로그 분석
   - 의존성 서비스 확인
   - 코드 검토

## 📋 정기 점검 항목

### 일일 점검
- [ ] 대시보드 확인
- [ ] 알림 상태 점검
- [ ] 로그 분석

### 주간 점검
- [ ] 성능 트렌드 분석
- [ ] 리소스 사용량 검토
- [ ] 알림 규칙 조정

### 월간 점검
- [ ] 모니터링 설정 검토
- [ ] 성능 기준 업데이트
- [ ] 용량 계획 수립
`;

    const readmePath = path.join(this.monitoringDir, 'README.md');
    fs.writeFileSync(readmePath, readme.trim());
    console.log(`✅ Created monitoring README: ${readmePath}`);
  }

  /**
   * 전체 모니터링 설정 실행
   */
  async setup() {
    console.log('🚀 MindBuddy 성능 모니터링 설정 시작...\n');

    try {
      this.createDirectories();
      this.createPrometheusConfig();
      this.createGrafanaDashboard();
      this.createAlertRules();
      this.createMonitoringStack();
      this.createPerformanceScript();
      this.createAlertManagerConfig();
      this.createMonitoringReadme();

      console.log('\n✅ 모니터링 설정 완료!');
      console.log('\n📋 다음 단계:');
      console.log('1. cd monitoring && docker-compose -f docker-compose.monitoring.yml up -d');
      console.log('2. Grafana 접속: http://localhost:3001 (admin/admin123!)');
      console.log('3. 대시보드 import: monitoring/dashboards/mindbuddy-dashboard.json');
      console.log('4. 성능 테스트: ./monitoring/scripts/performance-check.sh');

    } catch (error) {
      console.error('❌ 모니터링 설정 실패:', error.message);
      process.exit(1);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.setup();
}

module.exports = MonitoringSetup;