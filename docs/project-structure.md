# 마인드버디 프로젝트 구조

## 📁 디렉토리 구조

```
mindbuddy/
├── 📁 .github/                    # GitHub Actions 워크플로우
│   └── workflows/
│       └── ci.yml                 # CI/CD 파이프라인
├── 📁 config/                     # 설정 파일들
│   └── database.js                # 데이터베이스 연결 설정
├── 📁 docs/                       # 프로젝트 문서
│   ├── database-erd.md            # 데이터베이스 ERD
│   └── project-structure.md       # 프로젝트 구조 (이 파일)
├── 📁 middleware/                 # Express 미들웨어
│   ├── auth.js                    # 인증 미들웨어
│   ├── monitoring.js              # 모니터링 미들웨어
│   └── security.js                # 보안 미들웨어
├── 📁 models/                     # Mongoose 모델
│   ├── Booking.js                 # 예약 모델
│   ├── ChatMessage.js             # 채팅 메시지 모델
│   ├── Counselor.js               # 상담사 모델
│   ├── Notification.js            # 알림 모델
│   ├── Payment.js                 # 결제 모델
│   ├── Review.js                  # 리뷰 모델
│   └── User.js                    # 사용자 모델
├── 📁 public/                     # 정적 파일
│   └── js/
│       └── api.js                 # 클라이언트 API 라이브러리
├── 📁 routes/                     # Express 라우터
│   ├── admin.js                   # 관리자 라우트
│   ├── auth.js                    # 인증 라우트
│   ├── bookings.js                # 예약 라우트
│   ├── contact.js                 # 문의 라우트
│   ├── counselors.js              # 상담사 라우트
│   ├── health.js                  # 헬스체크 라우트
│   ├── payments.js                # 결제 라우트
│   ├── reviews.js                 # 리뷰 라우트
│   ├── sessions.js                # 세션 라우트
│   └── users.js                   # 사용자 라우트
├── 📁 scripts/                    # 유틸리티 스크립트
│   ├── init-database.js           # 데이터베이스 초기화
│   ├── migrate.js                 # 데이터 마이그레이션
│   └── mongo-init.js              # MongoDB 초기 설정
├── 📁 tests/                      # 테스트 파일
│   ├── models/                    # 모델 테스트
│   ├── routes/                    # 라우트 테스트
│   ├── utils/                     # 유틸리티 테스트
│   └── setup.js                   # 테스트 설정
├── 📁 uploads/                    # 업로드된 파일 저장소
├── 📁 utils/                      # 유틸리티 함수
│   ├── jitsi.js                   # Jitsi Meet 통합
│   ├── logger.js                  # 로깅 유틸리티
│   └── response.js                # API 응답 유틸리티
├── 📁 views/                      # HTML 템플릿
│   ├── admin.html                 # 관리자 페이지
│   ├── booking.html               # 예약 페이지
│   ├── client-dashboard.html      # 내담자 대시보드
│   ├── client-register.html       # 내담자 회원가입
│   ├── contact.html               # 문의 페이지
│   ├── counselor-dashboard.html   # 상담사 대시보드
│   ├── counselor-register.html    # 상담사 회원가입
│   ├── counselors.html            # 상담사 목록
│   ├── index.html                 # 메인 페이지
│   ├── login.html                 # 로그인 페이지
│   ├── payment.html               # 결제 페이지
│   ├── session.html               # 상담 세션 페이지
│   └── signup.html                # 회원가입 페이지
├── 📄 .env.example                # 환경변수 예시
├── 📄 .eslintrc.js                # ESLint 설정
├── 📄 .gitignore                  # Git 무시 파일 목록
├── 📄 .prettierrc                 # Prettier 설정
├── 📄 docker-compose.yml          # Docker Compose 설정
├── 📄 Dockerfile                  # Docker 이미지 빌드
├── 📄 jest.config.js              # Jest 테스트 설정
├── 📄 package.json                # NPM 패키지 설정
├── 📄 README.md                   # 프로젝트 설명서
└── 📄 server.js                   # 메인 서버 파일
```

## 🏗️ 아키텍처 패턴

### MVC (Model-View-Controller) 패턴
- **Model**: `models/` 디렉토리의 Mongoose 스키마
- **View**: `views/` 디렉토리의 HTML 템플릿
- **Controller**: `routes/` 디렉토리의 라우트 핸들러

### 레이어드 아키텍처
```
┌─────────────────────────────────────┐
│           Presentation Layer        │  ← views/, public/
├─────────────────────────────────────┤
│            Business Layer           │  ← routes/, middleware/
├─────────────────────────────────────┤
│           Data Access Layer         │  ← models/
├─────────────────────────────────────┤
│            Database Layer           │  ← MongoDB
└─────────────────────────────────────┘
```

## 📦 주요 컴포넌트

### 1. 인증 시스템
- **파일**: `middleware/auth.js`, `routes/auth.js`
- **기능**: JWT 기반 인증, 역할 기반 접근 제어
- **보안**: bcrypt 패스워드 해싱, 토큰 만료 관리

### 2. 예약 시스템
- **파일**: `routes/bookings.js`, `models/Booking.js`
- **기능**: 예약 생성/수정/취소, 시간 충돌 검사
- **통합**: 결제 시스템, 알림 시스템

### 3. 결제 시스템
- **파일**: `routes/payments.js`, `models/Payment.js`
- **기능**: 다중 결제 게이트웨이 지원, 환불 처리
- **보안**: PCI DSS 준수, 민감정보 암호화

### 4. 실시간 통신
- **파일**: `server.js` (Socket.IO), `utils/jitsi.js`
- **기능**: 실시간 채팅, 화상 상담, 알림
- **기술**: Socket.IO, Jitsi Meet API

### 5. 모니터링 시스템
- **파일**: `middleware/monitoring.js`, `utils/logger.js`
- **기능**: 성능 모니터링, 에러 추적, 로깅
- **도구**: Winston 로거, 메모리 사용량 추적

## 🔧 개발 도구

### 코드 품질
- **ESLint**: JavaScript 코드 린팅
- **Prettier**: 코드 포맷팅
- **Jest**: 단위 테스트 및 통합 테스트

### CI/CD
- **GitHub Actions**: 자동화된 테스트 및 배포
- **Docker**: 컨테이너화된 배포
- **MongoDB Memory Server**: 테스트용 인메모리 DB

### 보안
- **Helmet**: HTTP 보안 헤더
- **Rate Limiting**: API 요청 제한
- **Input Sanitization**: XSS/Injection 방지

## 📊 데이터 플로우

### 1. 사용자 등록 플로우
```
Client → auth/register → User Model → Database
                    ↓
              Email Verification → Notification
```

### 2. 예약 생성 플로우
```
Client → bookings/create → Booking Model → Database
                      ↓
              Payment Processing → Payment Model
                      ↓
              Notification → Both Users
```

### 3. 상담 세션 플로우
```
Client → session/join → Socket.IO → Jitsi Meet
                   ↓
              Chat Messages → ChatMessage Model
                   ↓
              Session Logs → Database
```

## 🚀 배포 전략

### 개발 환경
- **로컬 개발**: `npm run dev` (nodemon)
- **테스트**: `npm test` (Jest + MongoDB Memory Server)
- **린팅**: `npm run lint` (ESLint)

### 프로덕션 환경
- **컨테이너화**: Docker + Docker Compose
- **로드 밸런싱**: Nginx 리버스 프록시
- **데이터베이스**: MongoDB Atlas (클러스터)
- **파일 저장소**: AWS S3 또는 로컬 스토리지

### 모니터링
- **로그 수집**: Winston → 파일/외부 서비스
- **성능 모니터링**: 메모리, CPU 사용량 추적
- **에러 추적**: 자동 에러 로깅 및 알림

## 🔄 확장성 고려사항

### 수평 확장
- **마이크로서비스**: 기능별 서비스 분리 가능
- **데이터베이스 샤딩**: 사용자/날짜 기반 분산
- **캐싱**: Redis를 통한 세션/데이터 캐싱

### 성능 최적화
- **인덱싱**: 주요 쿼리 경로 최적화
- **연결 풀링**: MongoDB 연결 관리
- **정적 파일**: CDN을 통한 배포

## 📝 개발 가이드라인

### 코딩 컨벤션
- **파일명**: kebab-case (예: `user-profile.js`)
- **변수명**: camelCase (예: `userName`)
- **상수명**: UPPER_SNAKE_CASE (예: `MAX_FILE_SIZE`)
- **함수명**: 동사로 시작 (예: `getUserById`)

### 에러 처리
- **일관된 에러 응답**: `utils/response.js` 사용
- **로깅**: 모든 에러는 로그에 기록
- **사용자 친화적**: 기술적 세부사항 숨김

### 보안 원칙
- **최소 권한**: 필요한 권한만 부여
- **입력 검증**: 모든 사용자 입력 검증
- **민감정보**: 환경변수로 관리
- **정기 업데이트**: 의존성 보안 업데이트