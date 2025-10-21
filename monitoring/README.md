# MindBuddy 성능 모니터링

## 📊 모니터링 스택

### 구성 요소
- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 시각화 대시보드
- **AlertManager**: 알림 관리
- **Node Exporter**: 시스템 메트릭
- **MongoDB Exporter**: 데이터베이스 메트릭

## 🚀 설정 및 실행

### 1. 모니터링 스택 시작
```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. 대시보드 접속
- **Grafana**: http://localhost:3001 (admin/admin123!)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### 3. 성능 테스트 실행
```bash
cd monitoring/scripts
./performance-check.sh
```

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