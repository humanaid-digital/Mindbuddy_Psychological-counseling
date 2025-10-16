# 마인드버디 (MindBuddy) - 심리상담 플랫폼

마음의 건강을 위한 신뢰할 수 있는 온라인 심리상담 플랫폼

## 🎯 프로젝트 개요

마인드버디는 전문 심리상담사와 상담을 원하는 사람들을 연결하는 온라인 플랫폼입니다. 
안전하고 편리한 환경에서 화상, 음성, 채팅을 통한 다양한 상담 서비스를 제공합니다.

### 주요 기능

- 🧑‍💼 **상담자**: 전문 상담사 검색, 예약, 화상/음성/채팅 상담
- 👨‍⚕️ **상담사**: 프로필 관리, 일정 관리, 상담 진행, 수익 관리
- ⚙️ **관리자**: 상담사 승인, 사용자 관리, 통계 분석

## 🛠 기술 스택

### Backend
- **Node.js** - 런타임 환경
- **Express.js** - 웹 프레임워크
- **MongoDB** - 데이터베이스
- **Mongoose** - ODM
- **Socket.IO** - 실시간 통신
- **JWT** - 인증
- **bcryptjs** - 비밀번호 암호화

### Frontend
- **HTML5** - 마크업
- **CSS3** - 스타일링 (블루&화이트 + 옐로우 포인트)
- **JavaScript** - 클라이언트 로직
- **Socket.IO Client** - 실시간 통신

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd mindbuddy-backend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
MONGODB_URI=mongodb://localhost:27017/mindbuddy
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. MongoDB 실행
MongoDB가 설치되어 있고 실행 중인지 확인하세요.

### 5. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:5000`에서 실행됩니다.

## 📁 프로젝트 구조

```
mindbuddy-backend/
├── models/           # 데이터베이스 모델
│   ├── User.js      # 사용자 모델
│   ├── Counselor.js # 상담사 모델
│   ├── Booking.js   # 예약 모델
│   └── Review.js    # 리뷰 모델
├── routes/          # API 라우트
│   ├── auth.js      # 인증 관련
│   ├── users.js     # 사용자 관련
│   ├── counselors.js # 상담사 관련
│   ├── bookings.js  # 예약 관련
│   ├── sessions.js  # 세션 관련
│   ├── reviews.js   # 리뷰 관련
│   └── admin.js     # 관리자 관련
├── middleware/      # 미들웨어
│   └── auth.js      # 인증 미들웨어
├── public/          # 정적 파일
├── uploads/         # 업로드 파일
├── *.html          # 프론트엔드 페이지들
├── server.js       # 메인 서버 파일
├── package.json    # 프로젝트 설정
└── README.md       # 프로젝트 문서
```

## 🔗 API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/register/client` - 상담자 회원가입
- `POST /api/auth/register/counselor` - 상담사 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/logout` - 로그아웃

### 상담사 (Counselors)
- `GET /api/counselors` - 상담사 목록 조회
- `GET /api/counselors/:id` - 상담사 상세 조회
- `GET /api/counselors/:id/availability` - 상담사 가용시간 조회
- `PUT /api/counselors/profile` - 상담사 프로필 수정
- `GET /api/counselors/dashboard/stats` - 상담사 통계

### 예약 (Bookings)
- `POST /api/bookings` - 예약 생성
- `GET /api/bookings` - 예약 목록 조회
- `GET /api/bookings/:id` - 예약 상세 조회
- `PUT /api/bookings/:id/confirm` - 예약 확정
- `PUT /api/bookings/:id/cancel` - 예약 취소
- `PUT /api/bookings/:id/start` - 세션 시작

### 세션 (Sessions)
- `GET /api/sessions/:sessionId` - 세션 정보 조회
- `PUT /api/sessions/:sessionId/end` - 세션 종료

### 리뷰 (Reviews)
- `POST /api/reviews` - 리뷰 작성
- `GET /api/reviews/counselor/:counselorId` - 상담사 리뷰 목록

### 관리자 (Admin)
- `GET /api/admin/dashboard` - 관리자 대시보드
- `GET /api/admin/counselors/pending` - 승인 대기 상담사
- `PUT /api/admin/counselors/:id/approve` - 상담사 승인
- `PUT /api/admin/counselors/:id/reject` - 상담사 거절

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary Blue**: `#1e3a8a` (진한 블루)
- **Secondary Blue**: `#3b82f6` (밝은 블루)  
- **Light Blue**: `#dbeafe`, `#bfdbfe` (연한 블루 배경)
- **Accent Yellow**: `#fbbf24` (포인트 옐로우)
- **Light Yellow**: `#fef3c7`, `#fde68a` (연한 옐로우 배경)
- **White**: `#ffffff` (메인 배경)

## 🔒 보안

- JWT 기반 인증
- 비밀번호 bcrypt 암호화
- Rate Limiting
- CORS 설정
- Helmet 보안 헤더
- 입력 데이터 검증

## 📱 페이지 구조

- **`index.html`** - 메인 홈페이지
- **`login.html`** - 로그인
- **`signup.html`** - 회원가입 선택
- **`client-register.html`** - 상담자 회원가입
- **`counselor-register.html`** - 상담사 회원가입
- **`counselors.html`** - 상담사 목록
- **`booking.html`** - 상담 예약
- **`client-dashboard.html`** - 상담자 대시보드
- **`counselor-dashboard.html`** - 상담사 대시보드
- **`session.html`** - 화상상담 진행
- **`admin.html`** - 관리자 대시보드

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 👥 개발팀

**Human_AI_D** - 마인드버디 개발팀

---

💙 마음의 건강을 위한 신뢰할 수 있는 파트너, 마인드버디