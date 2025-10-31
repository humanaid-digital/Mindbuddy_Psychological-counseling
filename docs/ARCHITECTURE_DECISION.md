# 아키텍처 결정 문서

## 서비스 구조 통일: 하이브리드 모놀리식 접근

### 결정 사항
기존의 마이크로서비스 구조에서 **하이브리드 모놀리식 구조**로 변경

### 배경
- Docker Compose: 완전한 마이크로서비스 구조 (11개 서비스)
- 실제 구현: 모놀리식 구조 (단일 server.js)
- 구조 불일치로 인한 복잡성과 유지보수 어려움

### 새로운 구조

#### 1. 메인 애플리케이션 (모놀리식)
```
app (포트 5000)
├── 인증 (JWT)
├── 사용자 관리
├── 상담사 관리
├── 예약 시스템
├── 결제 처리
├── 알림 시스템
└── 세션 관리
```

#### 2. AI 서비스 (마이크로서비스)
```
ai-matching-service (포트 3006)
├── 상담사-내담자 매칭
├── 호환성 점수 계산
└── 추천 알고리즘

sentiment-analysis-service (포트 3007)
├── 실시간 감정 분석
├── 위험도 평가
└── 응급 상황 감지
```

#### 3. 인프라 서비스
```
postgres (포트 5432)    - 메인 데이터베이스
redis (포트 6379)       - 캐시 및 세션 저장
frontend (포트 3000)    - React 애플리케이션
nginx (포트 80/443)     - 리버스 프록시 (선택사항)
```

### 장점

#### 모놀리식 부분
- **단순성**: 대부분의 비즈니스 로직이 한 곳에 집중
- **개발 속도**: 빠른 개발과 디버깅
- **트랜잭션**: 데이터 일관성 보장
- **배포**: 단일 배포 단위

#### 마이크로서비스 부분 (AI)
- **독립성**: AI 모델 업데이트가 메인 앱에 영향 없음
- **확장성**: CPU 집약적 작업의 독립적 스케일링
- **기술 스택**: Python/TensorFlow 등 다른 기술 스택 사용 가능
- **장애 격리**: AI 서비스 장애가 전체 시스템에 영향 없음

### 파일 구조
```
mindbuddy/
├── server.js                    # 메인 애플리케이션
├── routes/                      # API 라우트
├── models/                      # 데이터베이스 모델
├── middleware/                  # 미들웨어
├── services/
│   ├── ai-matching/            # AI 매칭 서비스
│   │   ├── server.js
│   │   ├── matching-engine.js
│   │   └── Dockerfile
│   └── sentiment-analysis/     # 감정 분석 서비스
│       ├── server.js
│       ├── sentiment-analyzer.js
│       └── Dockerfile
├── frontend/                   # React 애플리케이션
├── docker-compose.yml          # 하이브리드 구조
└── docker-compose.monolith.yml # 완전 모놀리식 (백업)
```

### 통신 방식

#### 메인 앱 → AI 서비스
```javascript
// HTTP API 호출
const response = await fetch('http://ai-matching-service:3006/api/match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, preferences })
});
```

#### AI 서비스 → 메인 앱
```javascript
// Redis를 통한 비동기 통신
await redis.publish('counselor_alert', {
  sessionId,
  riskLevel: 'high',
  action: 'immediate_intervention'
});
```

### 배포 옵션

#### 개발 환경
```bash
# 전체 스택 실행
docker-compose up -d

# 메인 앱만 실행 (AI 서비스 없이)
docker-compose up -d app postgres redis frontend
```

#### 프로덕션 환경
```bash
# 완전한 하이브리드 구조
docker-compose -f docker-compose.yml up -d

# 완전한 모놀리식 (AI 기능 제외)
docker-compose -f docker-compose.monolith.yml up -d
```

### 마이그레이션 계획

#### 1단계: 현재 (완료)
- 모놀리식 메인 앱 유지
- AI 서비스 분리
- Docker Compose 단순화

#### 2단계: 향후 확장 (선택사항)
- 결제 서비스 분리 (PCI DSS 컴플라이언스)
- 알림 서비스 분리 (대용량 처리)
- 파일 업로드 서비스 분리 (CDN 연동)

### 결론
하이브리드 접근 방식으로 **개발 단순성**과 **AI 기능의 독립성**을 모두 확보하여 프로젝트의 실용성과 확장성을 균형있게 달성했습니다.