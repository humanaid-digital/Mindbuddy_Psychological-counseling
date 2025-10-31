#!/bin/bash

# Docker Hub 데모 스크립트 (실제 빌드 없이 테스트)

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 MindBuddy Docker Hub 데모${NC}"
echo ""

# 데모용 설정
DEMO_USERNAME="mindbuddy-demo"
DEMO_TAG="demo"

echo -e "${YELLOW}📋 데모 설정:${NC}"
echo "  - Docker Hub 사용자: $DEMO_USERNAME (데모용)"
echo "  - 태그: $DEMO_TAG"
echo "  - 모드: 시뮬레이션 (실제 빌드 없음)"
echo ""

# Docker 환경 확인
echo -e "${BLUE}🐳 Docker 환경 확인:${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker 설치됨: $(docker --version)${NC}"
else
    echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose 설치됨: $(docker-compose --version)${NC}"
else
    echo -e "${RED}❌ Docker Compose가 설치되지 않았습니다.${NC}"
    exit 1
fi

# Docker 서비스 확인
if docker info &> /dev/null; then
    echo -e "${GREEN}✅ Docker 서비스 실행 중${NC}"
else
    echo -e "${RED}❌ Docker 서비스가 실행되지 않았습니다.${NC}"
    exit 1
fi

echo ""

# 파일 구조 확인
echo -e "${BLUE}📁 프로젝트 구조 확인:${NC}"

required_files=(
    "Dockerfile.backend"
    "docker-compose.yml"
    "docker-compose.hub.yml"
    "services/ai-matching/Dockerfile"
    "services/sentiment-analysis/Dockerfile"
    "frontend/Dockerfile"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (누락)${NC}"
    fi
done

echo ""

# 빌드 시뮬레이션
echo -e "${BLUE}🔨 빌드 프로세스 시뮬레이션:${NC}"

services=("app" "ai-matching" "sentiment" "frontend")
contexts=("." "services/ai-matching" "services/sentiment-analysis" "frontend")

for i in "${!services[@]}"; do
    service="${services[$i]}"
    context="${contexts[$i]}"
    
    echo -e "${YELLOW}📦 $service 서비스 빌드 시뮬레이션...${NC}"
    echo "  - 컨텍스트: $context"
    echo "  - 이미지: $DEMO_USERNAME/mindbuddy-$service:$DEMO_TAG"
    
    # 실제로는 빌드하지 않고 시뮬레이션
    sleep 1
    echo -e "${GREEN}✅ $service 빌드 완료 (시뮬레이션)${NC}"
    echo ""
done

# Docker Compose 설정 검증
echo -e "${BLUE}🔍 Docker Compose 설정 검증:${NC}"

# docker-compose.yml 문법 확인
if docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ docker-compose.yml 문법 정상${NC}"
else
    echo -e "${RED}❌ docker-compose.yml 문법 오류${NC}"
fi

# docker-compose.hub.yml 문법 확인
if docker-compose -f docker-compose.hub.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ docker-compose.hub.yml 문법 정상${NC}"
else
    echo -e "${RED}❌ docker-compose.hub.yml 문법 오류${NC}"
fi

echo ""

# 환경 변수 확인
echo -e "${BLUE}🔧 환경 변수 확인:${NC}"

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env 파일 존재${NC}"
else
    echo -e "${YELLOW}⚠️  .env 파일 없음 (.env.example 사용 권장)${NC}"
fi

if [ -f ".env.hub" ]; then
    echo -e "${GREEN}✅ .env.hub 파일 존재${NC}"
else
    echo -e "${YELLOW}⚠️  .env.hub 파일 없음${NC}"
fi

echo ""

# 네트워크 및 포트 확인
echo -e "${BLUE}🌐 네트워크 및 포트 확인:${NC}"

ports=(5000 3000 3006 3007 5432 6379)
for port in "${ports[@]}"; do
    if lsof -i :$port &> /dev/null; then
        echo -e "${YELLOW}⚠️  포트 $port 사용 중${NC}"
    else
        echo -e "${GREEN}✅ 포트 $port 사용 가능${NC}"
    fi
done

echo ""

# 스크립트 실행 권한 확인
echo -e "${BLUE}🔐 스크립트 권한 확인:${NC}"

scripts=(
    "scripts/docker-setup.sh"
    "scripts/docker-build-push.sh"
    "scripts/docker-test.sh"
    "scripts/docker-ci-test.sh"
)

for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        echo -e "${GREEN}✅ $script (실행 가능)${NC}"
    else
        echo -e "${RED}❌ $script (실행 권한 없음)${NC}"
    fi
done

echo ""

# 데모 결과 요약
echo -e "${BLUE}📊 데모 결과 요약:${NC}"
echo -e "${GREEN}🎉 Docker Hub 테스트 환경이 준비되었습니다!${NC}"
echo ""

echo -e "${BLUE}🚀 다음 단계:${NC}"
echo "1. Docker Hub 계정 설정:"
echo "   export DOCKER_HUB_USERNAME=your-username"
echo ""
echo "2. 실제 빌드 및 푸시:"
echo "   npm run docker:build-push"
echo ""
echo "3. Docker Hub 이미지 테스트:"
echo "   npm run docker:test-hub"
echo ""
echo "4. CI/CD 테스트:"
echo "   npm run docker:ci-test"
echo ""

echo -e "${BLUE}📚 참고 문서:${NC}"
echo "  - docs/DOCKER_HUB_TESTING.md"
echo "  - docs/ARCHITECTURE_DECISION.md"
echo ""

echo -e "${GREEN}✨ 데모 완료!${NC}"