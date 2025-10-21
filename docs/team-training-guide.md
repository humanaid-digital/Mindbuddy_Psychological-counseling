# 마인드버디 팀 교육 가이드

## 🎯 교육 개요

새로운 프로젝트 구조와 보안 강화, 성능 모니터링 시스템에 대한 종합적인 교육 자료입니다.

## 📚 교육 과정

### 1단계: 프로젝트 구조 이해 (30분)
### 2단계: 보안 정책 및 도구 (45분)
### 3단계: 성능 모니터링 시스템 (30분)
### 4단계: 개발 워크플로우 (15분)

---

## 📁 1단계: 새로운 프로젝트 구조

### 🏗️ 디렉토리 구조 변경사항

#### 이전 구조 → 새로운 구조
```
mindbuddy/
├── *.html              →  views/
├── docs/               →  docs/ (확장됨)
├── models/             →  models/ (동일)
├── routes/             →  routes/ (동일)
├── middleware/         →  middleware/ (강화됨)
├── utils/              →  utils/ (확장됨)
├── tests/              →  tests/ (동일)
└── scripts/            →  scripts/ (확장됨)
```

### 📋 주요 변경사항

#### 1. HTML 파일 정리
```bash
# 이전: 루트 디렉토리에 흩어져 있던 HTML 파일들
index.html, login.html, signup.html...

# 현재: views/ 폴더로 체계적 정리
views/
├── index.html
├── login.html
├── signup.html
├── client-dashboard.html
├── counselor-dashboard.html
└── ...
```

#### 2. 문서화 강화
```bash
docs/
├── database-erd.md          # 완전한 ERD 문서
├── project-structure.md     # 프로젝트 구조 가이드
├── security-policy.md       # 보안 정책
└── team-training-guide.md   # 이 문서
```

#### 3. 유틸리티 확장
```bash
utils/
├── logger.js        # 기존 로깅 시스템
├── response.js      # 기존 API 응답 유틸리티
├── validation.js    # 🆕 보안 강화된 검증 로직
└── jitsi.js        # 화상 통화 유틸리티
```

### 🔧 개발 환경 설정

#### 1. 서버 실행 경로 변경
```javascript
// server.js에서 HTML 라우트 경로 업데이트
app.get(route.path, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', route.file));
});
```

#### 2. 새로운 npm 스크립트
```json
{
  "scripts": {
    "test:performance": "node scripts/performance-test.js",
    "docker:build": "docker build -t mindbuddy .",
    "docker:run": "docker run -p 5000:5000 --env-file .env mindbuddy",
    "docker:compose": "docker-compose up -d"
  }
}
```

---

## 🔒 2단계: 보안 정책 및 도구

### 🛡️ 보안 강화 개요

#### 현재 보안 취약점
- **validator.js URL 검증 우회 (CVSS 6.1)**
- 상태: ✅ `utils/validation.js`로 완화 조치 완료

### 🔍 새로운 보안 검증 시스템

#### 1. utils/validation.js 사용법

```javascript
const { 
  isSecureURL, 
  isSecureEmail, 
  isSecurePhone, 
  isSecureText,
  hasSQLInjection,
  hasNoSQLInjection 
} = require('../utils/validation');

// 안전한 URL 검증
if (!isSecureURL(userInput.website)) {
  return res.status(400).json({
    success: false,
    message: '유효하지 않은 URL입니다.'
  });
}

// 안전한 이메일 검증
if (!isSecureEmail(userInput.email)) {
  return res.status(400).json({
    success: false,
    message: '유효하지 않은 이메일입니다.'
  });
}

// SQL/NoSQL Injection 검사
if (hasSQLInjection(userInput.query) || hasNoSQLInjection(userInput.filter)) {
  return res.status(400).json({
    success: false,
    message: '보안 위험이 감지되었습니다.'
  });
}
```

#### 2. 강화된 보안 미들웨어

```javascript
// middleware/security.js 업데이트 사항

// 이전: 기본적인 XSS 방지
const sanitizeString = (str) => {
  return str.replace(/<script>/gi, '').trim();
};

// 현재: 포괄적인 보안 검증
const sanitizeString = (str) => {
  // 길이 제한 (DoS 방지)
  if (str.length > 10000) {
    throw new Error('Input too long');
  }

  // 보안 검증
  if (!isSecureText(str, 10000)) {
    throw new Error('Invalid input detected');
  }

  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
};
```

### 🚨 보안 체크리스트

#### 개발 시 필수 확인사항
- [ ] 모든 사용자 입력에 `utils/validation.js` 적용
- [ ] API 엔드포인트에 Rate Limiting 적용
- [ ] 민감정보 로깅 방지
- [ ] JWT 토큰 만료 시간 적절히 설정
- [ ] HTTPS 사용 (프로덕션)

#### 코드 리뷰 시 확인사항
- [ ] 입력 검증 로직 구현 여부
- [ ] SQL/NoSQL Injection 방지 여부
- [ ] XSS 방지 조치 여부
- [ ] 인증/권한 검사 여부
- [ ] 에러 메시지에 민감정보 노출 여부

---

## 📊 3단계: 성능 모니터링 시스템

### 🚀 성능 테스트 도구

#### 1. scripts/performance-test.js 사용법

```bash
# 기본 성능 테스트
npm run test:performance

# 특정 URL 테스트
node scripts/performance-test.js http://localhost:5000

# 사용자 정의 테스트
node scripts/performance-test.js http://production-url.com
```

#### 2. 성능 테스트 결과 해석

```javascript
// 성능 등급 기준
🥇 EXCELLENT: 응답시간 < 100ms, 성공률 > 99%
🥈 GOOD: 응답시간 < 200ms, 성공률 > 95%
🥉 FAIR: 응답시간 < 500ms, 성공률 > 90%
⚠️ NEEDS IMPROVEMENT: 위 기준 미달

// 주요 메트릭
- 평균 응답시간: 12.36ms ✅
- 초당 처리량: 996.05 RPS ✅
- 성공률: 100% ✅
- 동시 연결: 100개 처리 가능 ✅
```

### 📈 모니터링 대시보드 설정

#### 1. 모니터링 스택 시작
```bash
# 모니터링 설정 실행
node scripts/monitoring-setup.js

# 모니터링 스택 시작
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

#### 2. 대시보드 접속
- **Grafana**: http://localhost:3001 (admin/admin123!)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

#### 3. 주요 모니터링 메트릭
```javascript
// 애플리케이션 메트릭
- 응답 시간 (95th, 50th percentile)
- 초당 요청 수 (RPS)
- 에러율
- 활성 연결 수

// 시스템 메트릭
- CPU 사용률
- 메모리 사용량
- 디스크 I/O
- 네트워크 트래픽

// 데이터베이스 메트릭
- MongoDB 연결 수
- 쿼리 성능
- 인덱스 사용률
```

### 🚨 알림 설정

#### 알림 조건 및 대응 방법
```yaml
# 높은 응답 시간 (> 1초, 2분간)
대응: 
  - 데이터베이스 쿼리 최적화
  - 캐싱 적용 검토
  - 로드 밸런싱 고려

# 높은 에러율 (> 5%, 1분간)
대응:
  - 로그 즉시 분석
  - 의존성 서비스 확인
  - 롤백 고려

# 높은 메모리 사용량 (> 512MB, 5분간)
대응:
  - 메모리 누수 확인
  - 프로세스 재시작
  - 가비지 컬렉션 튜닝
```

---

## 🔄 4단계: 개발 워크플로우

### 📋 새로운 개발 프로세스

#### 1. 개발 시작 전
```bash
# 1. 최신 코드 동기화
git pull origin main

# 2. 의존성 업데이트 확인
npm audit

# 3. 테스트 실행
npm test

# 4. 성능 기준 확인
npm run test:performance
```

#### 2. 개발 중
```bash
# 1. 코드 작성
# 2. 보안 검증 로직 적용
# 3. 단위 테스트 작성
# 4. 로컬 테스트 실행

npm test
npm run lint
```

#### 3. 커밋 전
```bash
# 1. 전체 테스트 실행
npm test

# 2. 린팅 검사
npm run lint

# 3. 보안 검사
npm audit

# 4. 성능 테스트 (필요시)
npm run test:performance
```

#### 4. PR 생성 시
- [ ] 모든 테스트 통과
- [ ] 보안 체크리스트 확인
- [ ] 코드 리뷰 요청
- [ ] 성능 영향 평가

### 🛠️ 개발 도구 사용법

#### 1. Docker 개발 환경
```bash
# 개발 환경 시작
docker-compose up -d

# 애플리케이션만 빌드
npm run docker:build

# 애플리케이션 실행
npm run docker:run
```

#### 2. 로그 분석
```bash
# 애플리케이션 로그
tail -f logs/app.log

# 에러 로그
tail -f logs/error.log

# 로그 정리
npm run logs:clear
```

#### 3. 데이터베이스 관리
```bash
# 데이터베이스 초기화
npm run db:init

# 마이그레이션 실행
npm run db:migrate
```

---

## 🎯 실습 과제

### 과제 1: 보안 검증 적용 (30분)
기존 API 엔드포인트에 새로운 보안 검증 로직을 적용해보세요.

```javascript
// routes/users.js에서 프로필 업데이트 API 보안 강화
const { isSecureEmail, isSecureText } = require('../utils/validation');

router.put('/profile', auth, async (req, res) => {
  const { name, email, bio } = req.body;

  // TODO: 보안 검증 로직 추가
  // 1. 이메일 검증
  // 2. 이름 검증  
  // 3. 자기소개 검증
  
  // 기존 로직...
});
```

### 과제 2: 성능 테스트 실행 (15분)
새로운 성능 테스트 도구를 사용해보세요.

```bash
# 1. 서버 시작
npm run dev

# 2. 성능 테스트 실행
npm run test:performance

# 3. 결과 분석 및 개선점 도출
```

### 과제 3: 모니터링 대시보드 설정 (45분)
모니터링 시스템을 설정하고 대시보드를 확인해보세요.

```bash
# 1. 모니터링 설정
node scripts/monitoring-setup.js

# 2. 모니터링 스택 시작
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# 3. Grafana 대시보드 확인
# http://localhost:3001 접속 (admin/admin123!)
```

---

## 📞 지원 및 문의

### 기술 지원
- **개발팀 리드**: dev-lead@mindbuddy.com
- **보안 담당자**: security@mindbuddy.com
- **DevOps 엔지니어**: devops@mindbuddy.com

### 문서 및 리소스
- **프로젝트 구조**: `docs/project-structure.md`
- **보안 정책**: `docs/security-policy.md`
- **데이터베이스 ERD**: `docs/database-erd.md`
- **성능 모니터링**: `monitoring/README.md`

### 정기 교육 일정
- **주간 기술 세미나**: 매주 금요일 오후 2시
- **월간 보안 교육**: 매월 첫째 주 화요일
- **분기별 아키텍처 리뷰**: 분기 마지막 주

---

## ✅ 교육 완료 체크리스트

### 필수 이해사항
- [ ] 새로운 프로젝트 구조 이해
- [ ] 보안 검증 로직 사용법 숙지
- [ ] 성능 테스트 도구 사용법 습득
- [ ] 모니터링 대시보드 활용법 이해
- [ ] 새로운 개발 워크플로우 적용

### 실습 완료
- [ ] 보안 검증 로직 적용 실습
- [ ] 성능 테스트 실행 및 분석
- [ ] 모니터링 대시보드 설정 및 확인

### 다음 단계
- [ ] 실제 개발 프로젝트에 적용
- [ ] 팀원들과 지식 공유
- [ ] 정기 교육 참여 계획 수립

---

**교육 자료 버전**: v1.0  
**최종 업데이트**: 2025년 10월 21일  
**다음 업데이트 예정**: 2025년 11월 21일