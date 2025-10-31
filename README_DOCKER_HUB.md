# MindBuddy Docker Hub 테스트 가이드

## 🐳 Docker Hub 통합 테스트 환경

MindBuddy 프로젝트는 Docker Hub를 활용한 완전한 컨테이너화 환경을 제공합니다.

## 🚀 빠른 시작

### 1. 환경 준비

```bash
# 프로젝트 클론
git clone <repository-url>
cd Mindbuddy_Psychological-counseling

# Docker 환경 확인
npm run docker:demo
```

### 2. Docker Hub 이미지 빌드 및 푸시

```bash
# Docker Hub 로그인
docker login

# 환경 변수 설정
export DOCKER_HUB_USERNAME=your-username

# 빌드 및 푸시 (대화형)
npm run docker:build-push
```

### 3. Docker Hub 이미지 테스트

```bash
# 테스트 실행 (대화형)
npm run docker:test-hub

# 또는 수동 실행
export DOCKER_HUB_USERNAME=your-username
export TAG=latest
npm run docker:hub-up
```

## 📦 Docker 이미지 구조

### 빌드되는 이미지들

| 서비스 | 이미지명 | 포트 | 설명 |
|--------|----------|------|------|
| 메인 앱 | `mindbuddy-app` | 5000 | Node.js 백엔드 API |
| 프론트엔드 | `mindbuddy-frontend` | 3000 | React 웹 애플리케이션 |
| AI 매칭 | `mindbuddy-ai-matching` | 3006 | AI 기반 매칭 서비스 |
| 감정 분석 | `mindbuddy-sentiment` | 3007 | 실시간 감정 분석 |

### 인프라 서비스

| 서비스 | 이미지 | 포트 | 설명 |
|--------|--------|------|------|
| PostgreSQL | `postgres:15-alpine` | 5432 | 메인 데이터베이스 |
| Redis | `redis:7-alpine` | 6379 | 캐시 및 세션 저장소 |
| Nginx | `nginx:alpine` | 80/443 | 리버스 프록시 |

## 🛠️ 사용 가능한 명령어

### 빌드 및 배포

```bash
npm run docker:build-push    # 이미지 빌드 및 Docker Hub 푸시
npm run docker:demo          # 환경 검증 (빌드 없음)
```

### 테스트

```bash
npm run docker:test-hub      # Docker Hub 이미지 테스트
npm run docker:ci-test       # CI/CD 환경 테스트
```

### 서비스 관리

```bash
npm run docker:hub-up        # Docker Hub 이미지로 서비스 시작
npm run docker:hub-down      # 서비스 중지
npm run docker:hub-logs      # 로그 확인
```

### 로컬 개발

```bash
npm run docker:dev           # 로컬 빌드로 개발 환경 시작
npm run docker:monolith      # 모놀리식 구조로 시작
```

## 🔍 테스트 시나리오

### 1. 헬스 체크

```bash
# 모든 서비스 헬스 체크
curl http://localhost:5000/health    # 메인 API
curl http://localhost:3000/health    # 프론트엔드
curl http://localhost:3006/health    # AI 매칭
curl http://localhost:3007/health    # 감정 분석
```

### 2. API 테스트

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

## 🔧 설정 파일

### Docker Compose 파일들

- `docker-compose.yml`: 로컬 빌드 환경
- `docker-compose.hub.yml`: Docker Hub 이미지 환경
- `docker-compose.monolith.yml`: 모놀리식 구조

### 환경 변수 파일들

- `.env`: 로컬 개발 환경
- `.env.hub`: Docker Hub 테스트 환경
- `.env.production`: 프로덕션 환경

### Dockerfile들

- `Dockerfile.backend`: 메인 애플리케이션
- `frontend/Dockerfile`: React 프론트엔드
- `services/ai-matching/Dockerfile`: AI 매칭 서비스
- `services/sentiment-analysis/Dockerfile`: 감정 분석 서비스

## 🤖 CI/CD 통합

### GitHub Actions

`.github/workflows/docker-test.yml` 파일을 통해 자동화된 테스트가 실행됩니다:

- **트리거**: Push to main/develop, Pull Request
- **기능**: 이미지 빌드, 푸시, 테스트, 보안 스캔
- **결과**: 테스트 결과 및 아티팩트 업로드

### 필요한 Secrets

```
DOCKER_HUB_USERNAME: Docker Hub 사용자명
DOCKER_HUB_TOKEN: Docker Hub 액세스 토큰
```

## 📊 모니터링 및 로깅

### 로그 확인

```bash
# 전체 서비스 로그
npm run docker:hub-logs

# 특정 서비스 로그
docker-compose -f docker-compose.hub.yml logs -f app
docker-compose -f docker-compose.hub.yml logs -f frontend
```

### 리소스 모니터링

```bash
# 컨테이너 리소스 사용량
docker stats

# 상세 헬스 정보
curl http://localhost:5000/health/detailed
```

## 🔒 보안 고려사항

1. **비루트 실행**: 모든 컨테이너는 비루트 사용자로 실행
2. **이미지 스캔**: Trivy를 통한 취약점 스캔
3. **시크릿 관리**: 환경 변수를 통한 민감 정보 관리
4. **네트워크 격리**: Docker 네트워크 사용

## 🚨 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   lsof -i :5000
   
   # 기존 컨테이너 정리
   npm run docker:hub-down
   ```

2. **이미지 풀 실패**
   ```bash
   # Docker Hub 로그인 확인
   docker login
   
   # 이미지 존재 확인
   docker search your-username/mindbuddy-app
   ```

3. **헬스 체크 실패**
   ```bash
   # 컨테이너 로그 확인
   docker-compose -f docker-compose.hub.yml logs app
   
   # 컨테이너 상태 확인
   docker-compose -f docker-compose.hub.yml ps
   ```

## 📚 추가 문서

- [Docker Hub 테스트 상세 가이드](docs/DOCKER_HUB_TESTING.md)
- [아키텍처 결정 문서](docs/ARCHITECTURE_DECISION.md)
- [환경 설정 가이드](docs/ENVIRONMENT_SETUP.md)

## 🎯 다음 단계

1. **로컬 테스트**: `npm run docker:demo`로 환경 확인
2. **이미지 빌드**: Docker Hub 계정 설정 후 빌드
3. **자동화 설정**: GitHub Actions Secrets 설정
4. **프로덕션 배포**: 환경별 설정 파일 준비

---

**💡 팁**: 처음 사용하시는 경우 `npm run docker:demo`로 환경을 먼저 확인해보세요!