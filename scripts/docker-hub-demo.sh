#!/bin/bash

# Docker Hub 실행 데모 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MindBuddy Docker Hub 실행 가이드${NC}"
echo ""

# Docker 상태 확인
echo -e "${CYAN}📋 1단계: Docker 환경 확인${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker 설치됨: $(docker --version)${NC}"
    
    if docker info &> /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker 데몬 실행 중${NC}"
        DOCKER_RUNNING=true
    else
        echo -e "${YELLOW}⚠️  Docker 데몬이 실행되지 않았습니다${NC}"
        echo -e "${YELLOW}💡 Docker Desktop을 시작하세요${NC}"
        DOCKER_RUNNING=false
    fi
else
    echo -e "${RED}❌ Docker가 설치되지 않았습니다${NC}"
    DOCKER_RUNNING=false
fi

echo ""

# 프로젝트 구조 확인
echo -e "${CYAN}📋 2단계: 프로젝트 구조 확인${NC}"

required_files=(
    "docker-compose.hub.yml"
    "Dockerfile.backend"
    "services/ai-matching/Dockerfile"
    "services/sentiment-analysis/Dockerfile"
    "frontend/Dockerfile"
    ".env.hub"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (누락)${NC}"
        all_files_exist=false
    fi
done

echo ""

# Docker Hub 계정 설정 안내
echo -e "${CYAN}📋 3단계: Docker Hub 계정 설정${NC}"
echo -e "${YELLOW}🔐 Docker Hub 로그인이 필요합니다:${NC}"
echo "   1. Docker Hub 계정 생성: https://hub.docker.com"
echo "   2. 로컬에서 로그인: docker login"
echo "   3. 환경 변수 설정:"
echo "      export DOCKER_HUB_USERNAME=your-username"
echo "      export TAG=latest"
echo ""

# 실행 시나리오 제시
echo -e "${CYAN}📋 4단계: 실행 시나리오${NC}"

if [ "$DOCKER_RUNNING" = true ] && [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}🎉 모든 조건이 충족되었습니다! 실제 실행이 가능합니다.${NC}"
    echo ""
    
    echo -e "${PURPLE}🚀 실행 옵션:${NC}"
    echo ""
    
    echo -e "${YELLOW}옵션 1: 빠른 테스트 (기존 이미지 사용)${NC}"
    echo "   # 공개 이미지 사용 (테스트용)"
    echo "   export DOCKER_HUB_USERNAME=mindbuddy"
    echo "   export TAG=latest"
    echo "   npm run docker:test-hub"
    echo ""
    
    echo -e "${YELLOW}옵션 2: 완전한 빌드 및 테스트${NC}"
    echo "   # 자신의 Docker Hub 계정 사용"
    echo "   docker login"
    echo "   export DOCKER_HUB_USERNAME=your-username"
    echo "   npm run docker:build-push"
    echo "   npm run docker:test-hub"
    echo ""
    
    echo -e "${YELLOW}옵션 3: CI/CD 스타일 테스트${NC}"
    echo "   # 자동화된 테스트"
    echo "   export DOCKER_HUB_USERNAME=your-username"
    echo "   export TAG=latest"
    echo "   npm run docker:ci-test"
    echo ""
    
    # 실제 실행 여부 확인
    read -p "실제로 Docker Hub 테스트를 실행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Docker Hub 테스트를 시작합니다...${NC}"
        
        # 환경 변수 설정
        if [ -z "$DOCKER_HUB_USERNAME" ]; then
            read -p "Docker Hub 사용자명을 입력하세요 (기본값: mindbuddy): " username
            export DOCKER_HUB_USERNAME=${username:-mindbuddy}
        fi
        
        if [ -z "$TAG" ]; then
            export TAG=latest
        fi
        
        echo -e "${YELLOW}📋 설정 정보:${NC}"
        echo "   - Docker Hub 사용자: $DOCKER_HUB_USERNAME"
        echo "   - 태그: $TAG"
        echo ""
        
        # 테스트 실행
        echo -e "${BLUE}🧪 테스트 실행 중...${NC}"
        if ./scripts/docker-test.sh; then
            echo -e "${GREEN}🎉 테스트 성공!${NC}"
        else
            echo -e "${RED}❌ 테스트 실패${NC}"
            echo -e "${YELLOW}💡 로그를 확인하세요: npm run docker:hub-logs${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  시뮬레이션 모드로 계속합니다.${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  실행 조건이 충족되지 않았습니다. 시뮬레이션을 진행합니다.${NC}"
fi

echo ""

# 시뮬레이션 실행
echo -e "${CYAN}📋 5단계: 실행 시뮬레이션${NC}"

echo -e "${BLUE}🔨 1. 이미지 빌드 시뮬레이션${NC}"
services=("app" "ai-matching" "sentiment" "frontend")
for service in "${services[@]}"; do
    echo -e "${YELLOW}   📦 mindbuddy-$service 빌드 중...${NC}"
    sleep 0.5
    echo -e "${GREEN}   ✅ mindbuddy-$service 빌드 완료${NC}"
done

echo ""
echo -e "${BLUE}📤 2. Docker Hub 푸시 시뮬레이션${NC}"
for service in "${services[@]}"; do
    echo -e "${YELLOW}   ⬆️  mindbuddy-$service 푸시 중...${NC}"
    sleep 0.5
    echo -e "${GREEN}   ✅ mindbuddy-$service 푸시 완료${NC}"
done

echo ""
echo -e "${BLUE}🚀 3. 서비스 시작 시뮬레이션${NC}"
echo -e "${YELLOW}   🐳 Docker Compose 실행 중...${NC}"
sleep 1
echo -e "${GREEN}   ✅ 모든 서비스 시작 완료${NC}"

echo ""
echo -e "${BLUE}🔍 4. 헬스 체크 시뮬레이션${NC}"
health_checks=(
    "메인 애플리케이션:http://localhost:5000/health"
    "프론트엔드:http://localhost:3000/health"
    "AI 매칭 서비스:http://localhost:3006/health"
    "감정 분석 서비스:http://localhost:3007/health"
)

for check in "${health_checks[@]}"; do
    service_name=$(echo "$check" | cut -d: -f1)
    url=$(echo "$check" | cut -d: -f2-)
    echo -e "${YELLOW}   🔍 $service_name 확인 중...${NC}"
    sleep 0.5
    echo -e "${GREEN}   ✅ $service_name 정상${NC}"
done

echo ""

# 결과 요약
echo -e "${CYAN}📊 실행 결과 요약${NC}"
echo -e "${GREEN}🎉 모든 시뮬레이션이 성공적으로 완료되었습니다!${NC}"
echo ""

echo -e "${BLUE}🌐 접속 정보 (실제 실행 시):${NC}"
echo "   - 프론트엔드: http://localhost:3000"
echo "   - API 서버: http://localhost:5000"
echo "   - AI 매칭: http://localhost:3006"
echo "   - 감정 분석: http://localhost:3007"
echo ""

echo -e "${BLUE}🛠️  유용한 명령어:${NC}"
echo "   - 환경 검증: npm run docker:demo"
echo "   - 빌드 및 푸시: npm run docker:build-push"
echo "   - 테스트 실행: npm run docker:test-hub"
echo "   - 서비스 시작: npm run docker:hub-up"
echo "   - 서비스 중지: npm run docker:hub-down"
echo "   - 로그 확인: npm run docker:hub-logs"
echo ""

echo -e "${BLUE}📚 참고 문서:${NC}"
echo "   - README_DOCKER_HUB.md"
echo "   - docs/DOCKER_HUB_TESTING.md"
echo "   - docs/BUG_FIXES.md"
echo ""

echo -e "${GREEN}✨ Docker Hub 실행 가이드 완료!${NC}"

# Docker가 실행 중이면 실제 명령어 제안
if [ "$DOCKER_RUNNING" = true ]; then
    echo ""
    echo -e "${PURPLE}🚀 다음 단계 (실제 실행):${NC}"
    echo "1. Docker Hub 로그인: docker login"
    echo "2. 환경 변수 설정: export DOCKER_HUB_USERNAME=your-username"
    echo "3. 테스트 실행: npm run docker:test-hub"
fi