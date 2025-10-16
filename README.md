# 마인드버디 (MindBuddy) - 심리상담 플랫폼

마인드버디는 전문 심리상담사와 상담을 원하는 사람들을 연결해주는 온라인 심리상담 플랫폼입니다.

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

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, bcryptjs
- **Validation**: express-validator
- **Logging**: Custom logging system
- **API Response**: Standardized response format

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design
- **Real-time**: Socket.IO Client
- **API Communication**: Fetch API

### DevOps
- **Containerization**: Docker
- **Process Management**: PM2
- **Reverse Proxy**: Nginx

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
│   └── database-erd.md # 데이터베이스 ERD
├── *.html              # HTML 페이지들
├── server.js           # 메인 서버 파일
├── package.json        # 의존성 관리
└── README.md           # 프로젝트 문서
```

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js (v16 이상)
- MongoDB (v4.4 이상)
- npm 또는 yarn

### 설치 과정

1. **저장소 클론**
```bash
git clone https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling.git
cd Mindbuddy_Psychological-counseling
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
# .env 파일 생성 및 편집
cp .env.example .env
```

4. **MongoDB 설치 및 실행**
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu
sudo apt-get install mongodb
sudo systemctl start mongod

# Windows
# MongoDB 공식 사이트에서 다운로드 후 설치
```

5. **데이터베이스 초기화**
```bash
npm run db:init
```

6. **서버 실행**
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 환경 변수 설정

`.env` 파일에 다음 변수들을 설정하세요:

```env
# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/mindbuddy

# JWT 시크릿
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 서버 설정
PORT=5000
NODE_ENV=development

# 프론트엔드 URL
FRONTEND_URL=http://localhost:3000

# 이메일 설정 (선택사항)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 파일 업로드 설정
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# 세션 설정
SESSION_DURATION=50

# Jitsi Meet 설정
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=mindbuddy
JITSI_JWT_SECRET=your-jitsi-jwt-secret
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

- **관리자**: `admin@mindbuddy.com` / `admin123!`
- **상담자**: `client@test.com` / `test123!`
- **상담사**: `counselor@test.com` / `test123!`

## 🐳 Docker 실행

### Docker Compose 사용
```bash
docker-compose up -d
```

### 개별 컨테이너 실행
```bash
# 백엔드
docker build -f Dockerfile.backend -t mindbuddy-backend .
docker run -p 5000:5000 mindbuddy-backend

# 프론트엔드
docker build -f Dockerfile.frontend -t mindbuddy-frontend .
docker run -p 3000:3000 mindbuddy-frontend
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

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 다음으로 연락해주세요:

- GitHub Issues: [Issues 페이지](https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling/issues)

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Socket.IO](https://socket.io/)
- [JWT](https://jwt.io/)

---

**마인드버디**와 함께 더 건강한 마음을 만들어가세요! 💚