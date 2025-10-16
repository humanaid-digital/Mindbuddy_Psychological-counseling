# MindBridge 도커 실행 가이드

이 문서는 MindBridge 애플리케이션을 도커를 사용하여 실행하는 방법을 설명합니다.

## 사전 요구사항

- Docker 설치
- Docker Compose 설치

## 실행 방법

1. 프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:

```bash
docker-compose up -d
```

2. 애플리케이션 접속:
   - 프론트엔드: http://localhost
   - 백엔드 API: http://localhost:8080
   - 데이터베이스: localhost:3306 (MySQL)

## 서비스 중지

```bash
docker-compose down
```

## 서비스 재시작

```bash
docker-compose restart
```

## 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# 실시간 로그 확인
docker-compose logs -f
```

## 데이터 볼륨

데이터베이스 데이터는 Docker 볼륨 `mindbridge-db-data`에 저장됩니다. 컨테이너를 삭제해도 데이터는 유지됩니다.

## 환경 변수 설정

필요한 경우 `docker-compose.yml` 파일에서 환경 변수를 수정할 수 있습니다.

## 주의사항

- 프로덕션 환경에서는 보안을 위해 JWT 시크릿 키와 데이터베이스 비밀번호를 변경하세요.
- HTTPS 설정이 필요한 경우 Nginx 설정을 수정하고 SSL 인증서를 추가하세요.