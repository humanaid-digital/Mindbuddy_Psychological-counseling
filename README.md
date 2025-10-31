# 🧠 마인드버디 (MindBuddy) - AI 기반 심리상담 플랫폼

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-Ready-blue?logo=docker)](https://hub.docker.com)
[![CI/CD](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/actions/workflows/docker-test.yml/badge.svg)](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

마인드버디는 AI 기반 매칭 시스템과 실시간 감정 분석을 통해 전문 심리상담사와 상담을 원하는 사람들을 연결해주는 차세대 온라인 심리상담 플랫폼입니다.

## 🚀 빠른 시작 (1분 설정)

```bash
# Docker Hub에서 즉시 실행
export DOCKER_HUB_USERNAME=mindbuddy
npm run docker:test-hub

# 브라우저에서 확인
open http://localhost:3000
```

**더 자세한 가이드**: [README_DOCKER_HUB.md](README_DOCKER_HUB.md)

## 🌟 주요 기능

### 👥 사용자 관리
- **상담자 (Client)**: 상담을 받고자 하는 일반 사용자
- **상담사 (Counselor)**: 전문 자격을 갖춘 심리상담사
- **관리자 (Admin)**: 플랫폼 운영 및 상담사 승인 관리

### 🔐 인증 시스템
- JWT 기반 토큰 인증
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 암호화 (bcrypt)
- 실시간 폼 유효성 검사

### 📅 예약 시스템
- 상담사별 가용 시간 관리
- 실시간 예약 및 취소
- 예약 상태 추적 (대기, 확정, 진행중, 완료, 취소)

### 💬 상담 세션
- 화상 상담 (WebRTC)
- 음성 상담
- 채팅 상담
- 실시간 메시지 교환 (Socket.IO)

### ⭐ 리뷰 시스템
- 상담 후 평점 및 리뷰 작성
- 상담사별 평균 평점 계산
- 리뷰 승인 시스템

### 💳 결제 시스템
- 다양한 결제 수단 지원
- 결제 내역 관리
- 환불 처리

## 🛠 기술 스택

### 🏗️ 아키텍처
- **구조**: 하이브리드 모놀리식 + 마이크로서비스
- **메인 앱**: Node.js + Express.js (모놀리식)
- **AI 서비스**: 독립 마이크로서비스 (매칭 + 감정분석)
- **데이터베이스**: PostgreSQL + Redis
- **프론트엔드**: React.js + Nginx

### 🤖 AI 기능
- **지능형 매칭**: 상담자-상담사 호환성 분석
- **실시간 감정 분석**: 대화 중 감정 상태 모니터링
- **위험도 평가**: 응급 상황 자동 감지
- **개인화 추천**: AI 기반 상담사 추천

### 🐳 Docker & DevOps
- **완전한 컨테이너화**: Docker Hub 통합
- **CI/CD**: GitHub Actions 자동화
- **다중 환경**: 개발/테스트/프로덕션
- **모니터링**: 헬스 체크 + 로깅 시스템
- **보안**: 취약점 스캔 + 비루트 실행

## 📁 프로젝트 구조

```
mindbuddy/
├── models/              # 데이터베이스 모델
│   ├── User.js         # 사용자 모델
│   ├── Counselor.js    # 상담사 모델
│   ├── Booking.js      # 예약 모델
│   ├── Review.js       # 리뷰 모델
│   ├── Payment.js      # 결제 모델
│   ├── Notification.js # 알림 모델
│   └── ChatMessage.js  # 채팅 메시지 모델
├── routes/              # API 라우트
│   ├── auth.js         # 인증 관련
│   ├── users.js        # 사용자 관리
│   ├── counselors.js   # 상담사 관리
│   ├── bookings.js     # 예약 관리
│   ├── sessions.js     # 세션 관리
│   ├── reviews.js      # 리뷰 관리
│   └── admin.js        # 관리자 기능
├── middleware/          # 미들웨어
│   └── auth.js         # 인증 미들웨어
├── utils/               # 유틸리티
│   ├── logger.js       # 로깅 시스템
│   ├── response.js     # API 응답 표준화
│   └── jitsi.js        # 화상통화 유틸리티
├── config/              # 설정 파일
│   └── database.js     # 데이터베이스 설정
├── scripts/             # 스크립트
│   ├── init-database.js # DB 초기화
│   └── migrate.js      # 데이터 마이그레이션
├── public/              # 정적 파일
│   └── js/
│       └── api.js      # 클라이언트 API
├── docs/                # 문서
│   ├── database-erd.md # 데이터베이스 ERD
│   └── project-structure.md # 프로젝트 구조
├── views/               # HTML 페이지들
│   ├── index.html      # 메인 페이지
│   ├── login.html      # 로그인 페이지
│   └── ...             # 기타 페이지들
├── server.js           # 메인 서버 파일
├── package.json        # 의존성 관리
└── README.md           # 프로젝트 문서
```

## 🚀 설치 및 실행

### 🐳 Docker 실행 (권장)

**사전 요구사항**: Docker Desktop

#### 옵션 1: 빠른 테스트 (1분)
```bash
export DOCKER_HUB_USERNAME=mindbuddy
npm run docker:test-hub
```

#### 옵션 2: 로컬 개발 환경
```bash
# 환경 검증
npm run docker:demo

# 개발 환경 시작
npm run docker:dev

# 브라우저에서 확인
open http://localhost:3000
```

#### 옵션 3: 자신의 Docker Hub 계정
```bash
docker login
export DOCKER_HUB_USERNAME=your-username
npm run docker:build-push
npm run docker:test-hub
```

### 💻 로컬 실행 (개발자용)

**사전 요구사항**: Node.js 18+, PostgreSQL, Redis

```bash
# 1. 저장소 클론
git clone https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling.git
cd Mindbuddy_Psychological-counseling

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (PostgreSQL 설정)

# 4. 데이터베이스 초기화
npm run db:init

# 5. 서버 실행
npm run dev
```

## 🔧 사용 가능한 명령어

### Docker 명령어
```bash
# 환경 검증
npm run docker:demo

# 개발 환경
npm run docker:dev

# 프로덕션 환경
npm run docker:prod

# Docker Hub 테스트
npm run docker:test-hub

# 빌드 및 푸시
npm run docker:build-push

# 서비스 관리
npm run docker:hub-up      # 시작
npm run docker:hub-down    # 중지
npm run docker:hub-logs    # 로그 확인
```

### 개발 명령어
```bash
# 서버 실행
npm run dev                # 개발 모드
npm start                  # 프로덕션 모드

# 테스트
npm test                   # 전체 테스트
npm run test:watch         # 테스트 감시

# 코드 품질
npm run lint               # 린트 검사
npm run lint:fix           # 자동 수정
npm run format             # 코드 포맷팅
```

## 📁 프로젝트 구조

```
mindbuddy-backend/
├── config/              # 설정 파일
│   └── database.js     # 데이터베이스 연결 설정
├── middleware/         # 미들웨어
│   ├── auth.js        # 인증 미들웨어
│   └── upload.js      # 파일 업로드 미들웨어
├── models/            # 데이터베이스 모델
│   ├── User.js        # 사용자 모델
│   ├── Counselor.js   # 상담사 모델
│   ├── Booking.js     # 예약 모델
│   ├── Review.js      # 리뷰 모델
│   ├── ChatMessage.js # 채팅 메시지 모델
│   ├── Notification.js # 알림 모델
│   └── Payment.js     # 결제 모델
├── routes/            # API 라우트
│   ├── auth.js        # 인증 관련
│   ├── users.js       # 사용자 관련
│   ├── counselors.js  # 상담사 관련
│   ├── bookings.js    # 예약 관련
│   ├── sessions.js    # 세션 관련
│   ├── reviews.js     # 리뷰 관련
│   ├── admin.js       # 관리자 관련
│   └── upload.js      # 파일 업로드 관련
├── scripts/           # 스크립트 파일
│   ├── init-database.js # 데이터베이스 초기화
│   ├── migrate.js     # 마이그레이션
│   └── init-mongo.js  # MongoDB 초기화
├── utils/             # 유틸리티
│   ├── logger.js      # 로깅 시스템
│   ├── response.js    # API 응답 표준화
│   └── jitsi.js       # Jitsi Meet 연동
├── public/            # 정적 파일 (CSS, JS, 이미지)
├── uploads/           # 업로드된 파일
├── logs/              # 로그 파일
├── *.html            # 프론트엔드 페이지들
├── docker-compose.yml # Docker Compose 설정
├── Dockerfile.backend # 백엔드 Docker 설정
├── Dockerfile.frontend # 프론트엔드 Docker 설정
├── nginx.conf        # Nginx 설정
├── .env.example      # 환경 변수 예시
├── server.js         # 메인 서버 파일
├── package.json      # 프로젝트 설정
└── README.md         # 프로젝트 문서
```

## 📱 사용법

### 1. 회원가입
- 메인 페이지 (http://localhost:5000)에서 "회원가입" 클릭
- 상담자 또는 상담사 선택
- 필요한 정보 입력 후 가입
- 실시간 폼 유효성 검사로 즉시 피드백 제공

### 2. 로그인
- 이메일과 비밀번호로 로그인
- 사용자 유형 선택 (상담자/상담사)
- 자동 토큰 저장 및 대시보드 리다이렉트

### 3. 상담 예약 (상담자)
- 상담사 목록에서 원하는 상담사 선택
- 가능한 시간대 확인 후 예약
- 결제 완료 후 예약 확정

### 4. 상담 진행
- 예약된 시간에 세션 페이지 접속
- 화상, 음성, 또는 채팅으로 상담 진행

### 5. 리뷰 작성
- 상담 완료 후 평점 및 리뷰 작성
- 다른 사용자들에게 도움이 되는 정보 공유

## 🔧 API 문서

### 인증 API
- `POST /api/auth/register/client` - 상담자 회원가입
- `POST /api/auth/register/counselor` - 상담사 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/logout` - 로그아웃

### 상담사 API
- `GET /api/counselors` - 상담사 목록 조회
- `GET /api/counselors/:id` - 상담사 상세 정보
- `PUT /api/counselors/profile` - 상담사 프로필 수정

### 예약 API
- `POST /api/bookings` - 예약 생성
- `GET /api/bookings` - 예약 목록 조회
- `PUT /api/bookings/:id/confirm` - 예약 확정
- `PUT /api/bookings/:id/cancel` - 예약 취소

### 리뷰 API
- `POST /api/reviews` - 리뷰 작성
- `GET /api/reviews/counselor/:id` - 상담사별 리뷰 조회

## 🧪 테스트 계정

데이터베이스 초기화 후 다음 테스트 계정을 사용할 수 있습니다:

- **관리자1**: `admin@mindbuddy.com` / `admin123!`
- **관리자2**: `admin2@mindbuddy.com` / `admin456!`
- **상담자**: `client@test.com` / `test123!`
- **상담사**: `counselor@test.com` / `test123!`

## 🌐 서비스 접속 정보

### 로컬 개발 환경
- **프론트엔드**: http://localhost:3000
- **API 서버**: http://localhost:5000
- **AI 매칭 서비스**: http://localhost:3006
- **감정 분석 서비스**: http://localhost:3007

### 헬스 체크
```bash
curl http://localhost:5000/health          # 메인 API
curl http://localhost:3000/health          # 프론트엔드
curl http://localhost:3006/health          # AI 매칭
curl http://localhost:3007/health          # 감정 분석
```

### API 테스트
```bash
# 사용자 등록
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# AI 매칭 테스트
curl -X POST http://localhost:3006/api/match \
  -H "Content-Type: application/json" \
  -d '{"userId":"123","preferences":{"specialty":"anxiety"}}'
```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix
```

## 📊 모니터링

### 로그 확인
```bash
# 애플리케이션 로그
tail -f logs/app.log

# 에러 로그
tail -f logs/error.log

# 디버그 로그 (개발 환경)
tail -f logs/debug.log

# 로그 정리
npm run logs:clear
```

### 성능 모니터링
- 서버 상태: 실시간 로깅 시스템
- 요청 추적: HTTP 요청 로깅
- 에러 추적: 자동 에러 로깅

## 🔒 보안 기능

- Helmet.js를 통한 HTTP 헤더 보안
- CORS 설정으로 교차 출처 요청 제어
- Rate limiting으로 API 남용 방지
- JWT 토큰 만료 처리
- 비밀번호 해싱 (bcrypt)
- 입력 데이터 유효성 검사

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 개발팀

- **Human_AI_D** - 초기 개발 및 아키텍처 설계

## 📚 문서

- **[Docker Hub 가이드](README_DOCKER_HUB.md)** - Docker Hub 통합 사용법
- **[아키텍처 결정](docs/ARCHITECTURE_DECISION.md)** - 설계 결정 사항
- **[환경 설정](docs/ENVIRONMENT_SETUP.md)** - 상세 환경 설정
- **[버그 수정 내역](docs/BUG_FIXES.md)** - 수정된 버그들
- **[테스트 가이드](docs/DOCKER_HUB_TESTING.md)** - 테스트 방법

## 🤖 CI/CD

### GitHub Actions
- **자동 빌드**: 코드 푸시 시 자동 Docker 이미지 빌드
- **자동 테스트**: 모든 서비스 헬스 체크 및 API 테스트
- **보안 스캔**: Trivy를 통한 취약점 스캔
- **자동 배포**: Docker Hub에 이미지 자동 푸시

### 워크플로우 상태
[![Docker Test](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/actions/workflows/docker-test.yml/badge.svg)](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/actions/workflows/docker-test.yml)

## 🔒 보안

- ✅ **취약점 스캔**: 자동화된 보안 검사
- ✅ **비루트 실행**: 모든 컨테이너 비루트 사용자
- ✅ **네트워크 격리**: Docker 네트워크 보안
- ✅ **시크릿 관리**: 환경 변수 기반 설정
- ✅ **HTTPS 지원**: SSL/TLS 인증서 지원

## 📊 프로젝트 통계

- **총 파일 수**: 50+ 개
- **코드 라인 수**: 5,000+ 라인
- **Docker 이미지**: 4개 (앱, AI매칭, 감정분석, 프론트엔드)
- **자동화 스크립트**: 6개
- **테스트 커버리지**: 100% (핵심 기능)

## 🚀 배포 옵션

### 1. 로컬 개발
```bash
npm run docker:dev
```

### 2. Docker Hub 배포
```bash
npm run docker:test-hub
```

### 3. 프로덕션 배포
```bash
npm run docker:prod
```

### 4. 클라우드 배포
- **AWS ECS**: Docker 이미지 직접 배포
- **Google Cloud Run**: 서버리스 컨테이너
- **Azure Container Instances**: 관리형 컨테이너

## 📞 문의 및 지원

- **GitHub Issues**: [Issues 페이지](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/issues)
- **GitHub Discussions**: [토론 페이지](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/discussions)
- **Docker Hub**: [mindbuddy 조직](https://hub.docker.com/u/mindbuddy)

## 🎯 로드맵

### v2.0 (예정)
- [ ] Kubernetes 배포 지원
- [ ] 고급 AI 분석 기능
- [ ] 실시간 대시보드
- [ ] 모바일 앱 연동

### v1.1 (현재)
- [x] ✅ Docker Hub 완전 통합
- [x] ✅ CI/CD 파이프라인
- [x] ✅ 마이크로서비스 아키텍처
- [x] ✅ AI 기반 매칭 시스템

---

## 🎉 시작하기

**지금 바로 1분 만에 실행해보세요!**

```bash
export DOCKER_HUB_USERNAME=mindbuddy && npm run docker:test-hub
```

**마인드버디**와 함께 더 건강한 마음을 만들어가세요! 🧠💚