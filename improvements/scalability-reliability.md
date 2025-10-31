# 확장성 및 안정성 개선안

## 🏗️ 마이크로서비스 아키텍처

### 서비스 분리
```yaml
# docker-compose.microservices.yml
version: '3.8'
services:
  auth-service:
    build: ./services/auth
    ports: ["3001:3000"]
    
  booking-service:
    build: ./services/booking
    ports: ["3002:3000"]
    
  notification-service:
    build: ./services/notification
    ports: ["3003:3000"]
    
  payment-service:
    build: ./services/payment
    ports: ["3004:3000"]
```

### API Gateway 구현
```javascript
// Kong 또는 Express Gateway 사용
const gateway = require('express-gateway');

gateway()
  .load(path.join(__dirname, 'gateway.config.yml'))
  .run();
```

## 📊 로드 밸런싱

### Nginx 로드 밸런서 설정
```nginx
upstream backend {
    server backend1:5000 weight=3;
    server backend2:5000 weight=2;
    server backend3:5000 weight=1;
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 데이터베이스 확장

### MongoDB 레플리카 셋
```javascript
// 읽기 분산
const readPreference = 'secondaryPreferred';
const users = await User.find().read(readPreference);
```

### 샤딩 전략
- 사용자 ID 기반 샤딩
- 지역별 데이터 분산

## 🚨 장애 복구

### Circuit Breaker 패턴
```javascript
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = new CircuitBreaker(callExternalService, options);
```

### 백업 및 복구
- 자동 백업 (일일/주간)
- 포인트-인-타임 복구
- 재해 복구 계획