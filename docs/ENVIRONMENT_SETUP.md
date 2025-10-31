# 환경 변수 설정 가이드

## PostgreSQL 데이터베이스 설정

### 1. 연결 방법

**방법 1: 연결 문자열 사용 (권장)**
```bash
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```

**방법 2: 개별 설정**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mindbuddy
DB_USER=postgres
DB_PASSWORD=password
```

### 2. 환경별 설정

#### 개발 환경 (.env)
```bash
# PostgreSQL 로컬 설정
DATABASE_URL=postgresql://postgres:password@localhost:5432/mindbuddy
DB_SSL=false
```

#### 프로덕션 환경 (.env.production)
```bash
# PostgreSQL 프로덕션 설정
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### 3. Docker 환경 설정

Docker Compose에서는 다음과 같이 설정됩니다:

```yaml
environment:
  - DATABASE_URL=postgresql://postgres:password@postgres:5432/mindbuddy_auth
```

### 4. 필수 환경 변수

#### 반드시 설정해야 하는 변수
- `JWT_SECRET`: JWT 토큰 암호화 키
- `DATABASE_URL` 또는 `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

#### 선택적 환경 변수
- `DB_SSL`: SSL 연결 사용 여부 (기본값: false)
- `DB_SSL_REJECT_UNAUTHORIZED`: SSL 인증서 검증 여부 (기본값: true)
- `REDIS_URL`: Redis 캐시 서버 URL
- `EMAIL_*`: 이메일 발송 설정
- `JITSI_*`: 화상 통화 설정

### 5. 환경 변수 검증

서버 시작 시 다음 검증이 수행됩니다:

1. **필수 변수 확인**: `JWT_SECRET`
2. **데이터베이스 연결 정보 확인**: `DATABASE_URL` 또는 개별 DB 설정
3. **연결 테스트**: PostgreSQL 서버 연결 확인

### 6. 트러블슈팅

#### 연결 실패 시 확인사항
1. PostgreSQL 서버가 실행 중인지 확인
2. 데이터베이스 이름, 사용자명, 비밀번호 확인
3. 호스트와 포트 번호 확인
4. 방화벽 설정 확인

#### 일반적인 오류
- `ECONNREFUSED`: PostgreSQL 서버가 실행되지 않음
- `authentication failed`: 잘못된 사용자명/비밀번호
- `database does not exist`: 데이터베이스가 존재하지 않음

### 7. 보안 권장사항

1. **프로덕션 환경**:
   - 강력한 비밀번호 사용
   - SSL 연결 활성화
   - 환경 변수를 파일이 아닌 시스템에서 관리

2. **개발 환경**:
   - `.env` 파일을 git에 커밋하지 않음
   - 기본 비밀번호 변경

### 8. 예제 설정

#### 로컬 개발
```bash
cp .env.example .env
# .env 파일을 편집하여 로컬 PostgreSQL 정보 입력
```

#### Docker 개발
```bash
docker-compose up -d postgres
# PostgreSQL 컨테이너가 시작되면 자동으로 연결됨
```

#### 프로덕션 배포
```bash
cp .env.production .env
# 프로덕션 데이터베이스 정보로 수정
```