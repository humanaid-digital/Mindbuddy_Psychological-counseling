# Docker Hub 테스트 가이드

## 개요

MindBuddy 프로젝트의 Docker Hub 이미지를 빌드, 푸시, 테스트하는 방법을 설명합니다.

## 사전 준비

### 1. Docker Hub 계정 설정

```bash
# Docker Hub 로그인
docker login

# 환경 변수 설정
export DOCKER_HUB_USERNAME=your-username
export TAG=v1.0.0  # 또는 latest
```

### 2. 필요한 파일 확인

- `docker-compose.hub.yml`: Docker Hub 이미지 사용 설정
- `.env.hub`: Docker Hub 테스트용 환경 변수
- `scripts/docker-build-push.sh`: 빌드 및 푸시 스크립트
- `scripts/docker-test.sh`: 테스트 스크립트
- `scripts/docker-ci-test.sh`: CI/CD용 테스트 스크립트

## 로컬 테스트

### 1. 이미지 빌드 및 푸시

```bash
# 대화형 빌드 및 푸시
npm run docker:build-push

# 또는 직접 실행
./scripts/docker-build-push.sh
```

### 2. Docker Hub 이미지 테스트

```bash
# 대화형 테스트
npm run docker:test-hub

# 또는 직접 실행
./scripts/docker-test.sh
```

### 3. 수동 테스트

```bash
# 환경 변수 설정
export DOCKER_HUB_USERNAME=your-username
export TAG=latest

# Docker Hub 이미지로 서비스 시작
npm run docker:hub-up

# 헬스 체크
curl http://localhost:5000/health
curl http://localhost:3000/health
curl http://localhost:3006/health
curl http://localhost:3007/health

# 서비스 중지
npm run docker:hub-down
```

## CI/CD 테스트

### GitHub Actions 설정

1. **Secrets 설정** (Repository Settings > Secrets and variables > Actions):
   ```
   DOCKER_HUB_USERNAME: your-docker-hub-username
   DOCKER_HUB_TOKEN: your-docker-hub-access-token
   ```

2. **워크플로우 트리거**:
   - Push to main/develop 브랜치
   - Pull Request to main 브랜치
   - 수동 실행 (workflow_dispatch)

3. **수동 실행 방법**:
   - GitHub > Actions > "Docker Hub Test" 워크플로우 선택
   - "Run workflow" 클릭
   - Docker Hub 사용자명과 태그 입력

### 로컬 CI 테스트

```bash
# CI 환경 시뮬레이션
export DOCKER_HUB_USERNAME=your-username
export TAG=latest
export TIMEOUT=120

./scripts/docker-ci-test.sh
```

## 이미지 구조

### 빌드되는 이미지들

1. **mindbuddy-app**: 메인 애플리케이션 (Node.js)
2. **mindbuddy-ai-matching**: AI 매칭 서비스
3. **mindbuddy-sentiment**: 감정 분석 서비스
4. **mindbuddy-frontend**: React 프론트엔드

### 이미지 태그 전략

- `latest`: 최신 안정 버전
- `v1.0.0`: 특정 버전 태그
- `develop`: 개발 브랜치 빌드
- `pr-123`: Pull Request 빌드

## 테스트 시나리오

### 1. 기본 헬스 체크

```bash
# 각 서비스의 헬스 체크 엔드포인트 확인
curl -f http://localhost:5000/health    # 메인 앱
curl -f http://localhost:3000/health    # 프론트엔드
curl -f http://localhost:3006/health    # AI 매칭
curl -f http://localhost:3007/health    # 감정 분석
```

### 2. API 기능 테스트

```bash
# 사용자 등록 테스트
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 로그인 테스트
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. AI 서비스 테스트

```bash
# AI 매칭 테스트
curl -X POST http://localhost:3006/api/match \
  -H "Content-Type: application/json" \
  -d '{"userId":"123","preferences":{"specialty":"anxiety"}}'

# 감정 분석 테스트
curl -X POST http://localhost:3007/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I feel very sad today","sessionId":"session123"}'
```

## 문제 해결

### 일반적인 문제들

1. **이미지 풀 실패**
   ```bash
   # 이미지 존재 확인
   docker search your-username/mindbuddy-app
   
   # 수동 풀 시도
   docker pull your-username/mindbuddy-app:latest
   ```

2. **헬스 체크 실패**
   ```bash
   # 컨테이너 로그 확인
   docker-compose -f docker-compose.hub.yml logs app
   
   # 컨테이너 내부 접근
   docker exec -it mindbuddy-app sh
   ```

3. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   lsof -i :5000
   lsof -i :3000
   
   # 기존 컨테이너 정리
   docker-compose down -v --remove-orphans
   ```

### 로그 분석

```bash
# 전체 서비스 로그
npm run docker:hub-logs

# 특정 서비스 로그
docker-compose -f docker-compose.hub.yml logs -f app
docker-compose -f docker-compose.hub.yml logs -f frontend

# 실시간 로그 모니터링
docker-compose -f docker-compose.hub.yml logs -f --tail=100
```

## 성능 모니터링

### 리소스 사용량 확인

```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너 모니터링
docker stats mindbuddy-app mindbuddy-frontend
```

### 헬스 체크 상세 정보

```bash
# 상세 헬스 체크
curl http://localhost:5000/health/detailed

# 준비 상태 확인 (Kubernetes 스타일)
curl http://localhost:5000/health/ready

# 생존 상태 확인
curl http://localhost:5000/health/live
```

## 보안 고려사항

1. **이미지 스캔**: Trivy를 사용한 취약점 스캔
2. **비루트 사용자**: 모든 컨테이너는 비루트 사용자로 실행
3. **시크릿 관리**: 환경 변수를 통한 민감 정보 관리
4. **네트워크 격리**: Docker 네트워크를 통한 서비스 간 통신

## 배포 전략

### 블루-그린 배포

```bash
# 현재 버전 (블루)
export TAG=v1.0.0
docker-compose -f docker-compose.hub.yml up -d

# 새 버전 (그린) 테스트
export TAG=v1.1.0
./scripts/docker-test.sh

# 성공 시 전환
docker-compose -f docker-compose.hub.yml down
export TAG=v1.1.0
docker-compose -f docker-compose.hub.yml up -d
```

### 롤링 업데이트

```bash
# 서비스별 순차 업데이트
docker-compose -f docker-compose.hub.yml up -d --no-deps app
docker-compose -f docker-compose.hub.yml up -d --no-deps frontend
```

이 가이드를 통해 Docker Hub 이미지의 전체 라이프사이클을 관리할 수 있습니다.