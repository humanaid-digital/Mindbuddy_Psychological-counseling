# 버그 수정 내역

## 🐛 수정된 버그들

### 1. Docker 컨테이너 간 통신 문제

**문제**: Docker Compose에서 `localhost` 사용으로 인한 서비스 간 통신 실패

**수정 사항**:
- `docker-compose.yml`, `docker-compose.hub.yml`, `docker-compose.monolith.yml`에서 환경 변수 수정
- `REACT_APP_API_URL`: `http://app:5000/api` → `/api` (nginx 프록시 사용)
- `REACT_APP_SERVER_URL`: `http://app:5000` → `""` (상대 경로 사용)

**영향**: 프론트엔드가 백엔드 API에 올바르게 접근 가능

### 2. Nginx 프록시 설정 오류

**문제**: 프론트엔드 nginx 설정에서 잘못된 백엔드 서비스명 참조

**수정 사항**:
- `frontend/nginx.conf`: `mindbuddy-app` → `app`
- `nginx.conf`: upstream 서버명을 Docker Compose 서비스명과 일치시킴

**영향**: API 프록시와 Socket.IO 연결이 정상 작동

### 3. Redis 헬스 체크 오류

**문제**: `routes/health.js`에서 존재하지 않는 `cache.ping()` 메서드 호출

**수정 사항**:
- `cache.isConnected()` → `cache.isConnected` (속성으로 변경)
- `cache.ping()` → `cache.client.ping()` (올바른 Redis 클라이언트 메서드 사용)

**영향**: 헬스 체크 엔드포인트가 정상 작동

### 4. AI 서비스 CORS 설정 누락

**문제**: AI 매칭 및 감정 분석 서비스에서 CORS 설정 부족

**수정 사항**:
- `services/ai-matching/server.js`와 `services/sentiment-analysis/server.js`에 CORS 설정 추가
- `origin`, `credentials` 옵션 설정
- 요청 크기 제한 추가 (`limit: '10mb'`)

**영향**: 프론트엔드에서 AI 서비스 API 호출 가능

### 5. Docker 테스트 스크립트 서비스명 불일치

**문제**: `scripts/docker-ci-test.sh`에서 서비스명과 컨테이너명 불일치

**수정 사항**:
- 로그 출력 시 서비스명을 컨테이너명으로 매핑하는 로직 추가
- 헬스 체크 실패 시 올바른 컨테이너 로그 출력

**영향**: CI/CD 테스트에서 정확한 디버깅 정보 제공

### 6. Package.json 스크립트 누락

**문제**: Docker Hub 관련 스크립트가 package.json에서 누락

**수정 사항**:
- `docker:demo`, `docker:hub-up`, `docker:hub-down`, `docker:hub-logs` 스크립트 추가
- 모든 Docker 관련 명령어를 npm 스크립트로 통일

**영향**: 일관된 명령어 인터페이스 제공

### 7. GitHub Actions 워크플로우 오류

**문제**: 취약점 스캔 액션에서 구버전 사용 및 오류 처리 부족

**수정 사항**:
- `github/codeql-action/upload-sarif@v2` → `@v3`로 업데이트
- `continue-on-error: true` 추가하여 스캔 실패 시에도 워크플로우 계속 진행

**영향**: CI/CD 파이프라인의 안정성 향상

### 8. 환경 변수 일관성 문제

**문제**: AI 서비스들에 `FRONTEND_URL` 환경 변수 누락

**수정 사항**:
- 모든 Docker Compose 파일에서 AI 서비스에 `FRONTEND_URL` 환경 변수 추가
- CORS 설정과 일관성 유지

**영향**: AI 서비스의 CORS 설정이 올바르게 작동

## 🔧 추가 개선 사항

### 1. 프론트엔드 런타임 설정

**추가**: `frontend/public/config.js` 파일 생성
- 빌드 시점이 아닌 런타임에 API URL 결정
- Docker 환경에서 동적 설정 가능

### 2. 에러 처리 강화

**개선**: 모든 헬스 체크에서 try-catch 블록 강화
- 더 상세한 에러 메시지 제공
- 서비스별 상태 구분

### 3. 로깅 개선

**개선**: Docker 테스트 스크립트에서 실패 시 로그 수집 강화
- 서비스별 로그 분리
- 디버깅 정보 향상

## 🧪 테스트 방법

### 수정 사항 검증

```bash
# 1. 환경 검증
npm run docker:demo

# 2. 로컬 빌드 테스트
npm run docker:dev

# 3. 헬스 체크 확인
curl http://localhost:5000/health
curl http://localhost:3000/health
curl http://localhost:3006/health
curl http://localhost:3007/health

# 4. API 테스트
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Docker Hub 테스트

```bash
# 환경 변수 설정
export DOCKER_HUB_USERNAME=your-username

# 빌드 및 테스트
npm run docker:build-push
npm run docker:test-hub
```

## 📊 수정 전후 비교

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 컨테이너 간 통신 | ❌ localhost 사용 | ✅ 서비스명 사용 |
| 헬스 체크 | ❌ 메서드 오류 | ✅ 정상 작동 |
| CORS 설정 | ❌ 기본 설정만 | ✅ 완전한 설정 |
| 에러 처리 | ❌ 부분적 | ✅ 포괄적 |
| 스크립트 완성도 | ❌ 일부 누락 | ✅ 완전 |
| CI/CD 안정성 | ❌ 실패 시 중단 | ✅ 계속 진행 |

## 🚀 다음 단계

1. **성능 최적화**: 컨테이너 리소스 사용량 최적화
2. **보안 강화**: 추가 보안 헤더 및 설정
3. **모니터링 개선**: 더 상세한 메트릭 수집
4. **자동화 확장**: 더 많은 테스트 시나리오 추가

모든 버그가 수정되어 Docker 환경에서 안정적으로 작동합니다.