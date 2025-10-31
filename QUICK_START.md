# 🚀 MindBuddy Docker Hub 빠른 시작

## ⚡ 1분 빠른 실행

```bash
# 1. 환경 변수 설정 (테스트용)
export DOCKER_HUB_USERNAME=mindbuddy
export TAG=latest

# 2. 테스트 실행
npm run docker:test-hub
```

## 📋 실행 전 체크리스트

- ✅ Docker 설치 및 실행 중
- ✅ 모든 필수 파일 존재
- ✅ 포트 5000, 3000, 3006, 3007 사용 가능

## 🎯 실행 옵션

### 옵션 A: 빠른 테스트 (권장)
```bash
export DOCKER_HUB_USERNAME=mindbuddy
npm run docker:test-hub
```

### 옵션 B: 수동 실행
```bash
export DOCKER_HUB_USERNAME=mindbuddy
npm run docker:hub-up
# 브라우저에서 http://localhost:3000 접속
```

### 옵션 C: 자신의 이미지 빌드
```bash
docker login
export DOCKER_HUB_USERNAME=your-username
npm run docker:build-push
npm run docker:test-hub
```

## 🔍 확인 방법

### 헬스 체크
```bash
curl http://localhost:5000/health
curl http://localhost:3000/health
curl http://localhost:3006/health
curl http://localhost:3007/health
```

### 웹 접속
- 프론트엔드: http://localhost:3000
- API 문서: http://localhost:5000/health

## 🛑 중지 방법

```bash
npm run docker:hub-down
```

## 🐛 문제 발생 시

```bash
# 로그 확인
npm run docker:hub-logs

# 상태 확인
npm run docker:hub-ps

# 완전 정리
npm run docker:clean
```

---

**💡 지금 바로 실행해보세요!**

```bash
export DOCKER_HUB_USERNAME=mindbuddy && npm run docker:test-hub
```