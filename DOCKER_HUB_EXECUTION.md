# 🚀 Docker Hub 실행 가이드

## 현재 상태
✅ Docker 설치됨 및 실행 중  
✅ 모든 필수 파일 존재  
✅ 실행 준비 완료  

## 🎯 실행 옵션

### 옵션 1: 빠른 테스트 (권장 - 첫 실행)

```bash
# 1. 환경 변수 설정 (테스트용 공개 이미지 사용)
export DOCKER_HUB_USERNAME=mindbuddy
export TAG=latest

# 2. 테스트 실행
npm run docker:test-hub
```

### 옵션 2: 자신의 Docker Hub 계정으로 빌드

```bash
# 1. Docker Hub 로그인
docker login

# 2. 환경 변수 설정
export DOCKER_HUB_USERNAME=your-actual-username
export TAG=v1.0.0

# 3. 빌드 및 푸시
npm run docker:build-push

# 4. 테스트 실행
npm run docker:test-hub
```

### 옵션 3: CI/CD 스타일 자동화 테스트

```bash
# 1. 환경 변수 설정
export DOCKER_HUB_USERNAME=your-username
export TAG=latest
export TIMEOUT=120

# 2. CI 테스트 실행
npm run docker:ci-test
```

## 🔧 실행 명령어

### 기본 명령어
```bash
# 환경 검증
npm run docker:demo

# Docker Hub 데모 실행
npm run docker:hub-demo

# 서비스 시작
npm run docker:hub-up

# 서비스 중지
npm run docker:hub-down

# 로그 확인
npm run docker:hub-logs

# 상태 확인
docker-compose -f docker-compose.hub.yml ps
```

### 헬스 체크
```bash
# 모든 서비스 헬스 체크
curl http://localhost:5000/health
curl http://localhost:3000/health
curl http://localhost:3006/health
curl http://localhost:3007/health

# 상세 헬스 체크
curl http://localhost:5000/health/detailed
```

### API 테스트
```bash
# 사용자 등록 테스트
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# AI 매칭 테스트
curl -X POST http://localhost:3006/api/match \
  -H "Content-Type: application/json" \
  -d '{"userId":"123","preferences":{"specialty":"anxiety"}}'

# 감정 분석 테스트
curl -X POST http://localhost:3007/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I feel very sad today","sessionId":"session123"}'
```

## 🐛 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   lsof -i :5000
   lsof -i :3000
   
   # 기존 컨테이너 정리
   npm run docker:hub-down
   docker system prune -f
   ```

2. **이미지 풀 실패**
   ```bash
   # Docker Hub 로그인 확인
   docker login
   
   # 수동 이미지 풀
   docker pull mindbuddy/mindbuddy-app:latest
   ```

3. **헬스 체크 실패**
   ```bash
   # 컨테이너 로그 확인
   npm run docker:hub-logs
   
   # 특정 서비스 로그
   docker-compose -f docker-compose.hub.yml logs app
   ```

### 디버깅 명령어
```bash
# 컨테이너 상태 확인
docker ps -a

# 리소스 사용량 확인
docker stats

# 네트워크 확인
docker network ls
docker network inspect mindbuddy_mindbuddy-network

# 볼륨 확인
docker volume ls
```

## 📊 모니터링

### 실시간 모니터링
```bash
# 모든 컨테이너 로그 실시간 확인
npm run docker:hub-logs

# 리소스 사용량 실시간 확인
docker stats

# 특정 서비스 모니터링
watch -n 2 'curl -s http://localhost:5000/health | jq'
```

### 성능 체크
```bash
# 응답 시간 측정
time curl http://localhost:5000/health

# 부하 테스트 (간단)
for i in {1..10}; do
  curl -s http://localhost:5000/health > /dev/null && echo "Request $i: OK"
done
```

## 🎯 성공 기준

### 모든 서비스가 정상 작동하는 경우:
- ✅ 모든 헬스 체크 통과 (200 응답)
- ✅ 프론트엔드 접속 가능 (http://localhost:3000)
- ✅ API 호출 성공
- ✅ AI 서비스 응답 정상

### 예상 결과:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "uptime": 30.5,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {"status": "healthy", "type": "postgresql"},
    "redis": {"status": "healthy", "type": "redis"}
  }
}
```

## 🚀 다음 단계

1. **로컬 테스트 완료 후**:
   - GitHub Actions 설정
   - 프로덕션 환경 배포
   - 모니터링 시스템 구축

2. **확장 계획**:
   - Kubernetes 배포
   - 로드 밸런싱
   - 자동 스케일링

---

**💡 팁**: 처음 실행하시는 경우 옵션 1 (빠른 테스트)부터 시작하세요!