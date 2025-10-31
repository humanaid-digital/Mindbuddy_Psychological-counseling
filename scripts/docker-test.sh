#!/bin/bash

# Docker Hub 이미지 테스트 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 MindBuddy Docker Hub 이미지 테스트${NC}"
echo ""

# 환경 변수 설정
if [ -z "$DOCKER_HUB_USERNAME" ]; then
    read -p "Docker Hub 사용자명을 입력하세요: " DOCKER_HUB_USERNAME
    export DOCKER_HUB_USERNAME
fi

if [ -z "$TAG" ]; then
    TAG="latest"
    read -p "테스트할 이미지 태그 (기본값: latest): " input_tag
    if [ ! -z "$input_tag" ]; then
        TAG="$input_tag"
    fi
fi

echo -e "${YELLOW}📋 테스트 정보:${NC}"
echo "  - Docker Hub 사용자: $DOCKER_HUB_USERNAME"
echo "  - 태그: $TAG"
echo ""

# 기존 컨테이너 정리
echo -e "${BLUE}🧹 기존 컨테이너 정리 중...${NC}"
docker-compose -f docker-compose.hub.yml down -v --remove-orphans 2>/dev/null || true

# 이미지 풀
echo -e "${BLUE}📥 Docker Hub에서 이미지 풀링 중...${NC}"
services=("app" "ai-matching" "sentiment" "frontend")

for service in "${services[@]}"; do
    image_name="$DOCKER_HUB_USERNAME/mindbuddy-$service:$TAG"
    echo -e "${YELLOW}⬇️  $image_name 풀링...${NC}"
    
    if docker pull "$image_name"; then
        echo -e "${GREEN}✅ $service 이미지 풀 완료${NC}"
    else
        echo -e "${RED}❌ $service 이미지 풀 실패${NC}"
        echo -e "${YELLOW}💡 이미지가 존재하지 않거나 접근 권한이 없을 수 있습니다.${NC}"
        exit 1
    fi
done

echo ""
echo -e "${BLUE}🚀 Docker Compose로 서비스 시작...${NC}"

# Docker Compose 실행
if DOCKER_HUB_USERNAME="$DOCKER_HUB_USERNAME" TAG="$TAG" docker-compose -f docker-compose.hub.yml up -d; then
    echo -e "${GREEN}✅ 서비스 시작 완료${NC}"
else
    echo -e "${RED}❌ 서비스 시작 실패${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}⏳ 서비스 초기화 대기 중...${NC}"
sleep 15

# 서비스 상태 확인
echo ""
echo -e "${BLUE}📊 서비스 상태 확인:${NC}"
docker-compose -f docker-compose.hub.yml ps

echo ""
echo -e "${BLUE}🔍 헬스 체크 수행:${NC}"

# 헬스 체크 함수
check_health() {
    local service_name="$1"
    local url="$2"
    local max_attempts=10
    local attempt=1
    
    echo -n -e "${YELLOW}🔍 $service_name 헬스 체크... ${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 정상${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 3
        ((attempt++))
    done
    
    echo -e "${RED}❌ 실패 (30초 타임아웃)${NC}"
    return 1
}

# 각 서비스 헬스 체크
health_results=()

check_health "메인 애플리케이션" "http://localhost:5000/health"
health_results+=($?)

check_health "프론트엔드" "http://localhost:3000/health"
health_results+=($?)

check_health "AI 매칭 서비스" "http://localhost:3006/health"
health_results+=($?)

check_health "감정 분석 서비스" "http://localhost:3007/health"
health_results+=($?)

# 결과 요약
echo ""
echo -e "${BLUE}📋 테스트 결과 요약:${NC}"

failed_count=0
for result in "${health_results[@]}"; do
    if [ $result -ne 0 ]; then
        ((failed_count++))
    fi
done

if [ $failed_count -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 서비스가 정상적으로 작동합니다!${NC}"
else
    echo -e "${RED}❌ $failed_count개 서비스에서 문제가 발생했습니다.${NC}"
fi

# 로그 확인 제안
if [ $failed_count -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}🔍 문제 해결을 위한 로그 확인:${NC}"
    echo "  docker-compose -f docker-compose.hub.yml logs"
    echo ""
    echo -e "${YELLOW}🛠️  개별 서비스 로그 확인:${NC}"
    echo "  docker-compose -f docker-compose.hub.yml logs app"
    echo "  docker-compose -f docker-compose.hub.yml logs frontend"
    echo "  docker-compose -f docker-compose.hub.yml logs ai-matching-service"
    echo "  docker-compose -f docker-compose.hub.yml logs sentiment-service"
fi

echo ""
echo -e "${BLUE}🌐 접속 정보:${NC}"
echo "  - 프론트엔드: http://localhost:3000"
echo "  - API 서버: http://localhost:5000"
echo "  - 헬스 체크: http://localhost:5000/health"
echo "  - AI 매칭: http://localhost:3006/health"
echo "  - 감정 분석: http://localhost:3007/health"

echo ""
echo -e "${BLUE}🛠️  유용한 명령어:${NC}"
echo "  - 로그 확인: docker-compose -f docker-compose.hub.yml logs -f"
echo "  - 서비스 중지: docker-compose -f docker-compose.hub.yml down"
echo "  - 상태 확인: docker-compose -f docker-compose.hub.yml ps"
echo "  - 재시작: docker-compose -f docker-compose.hub.yml restart"

# 성공/실패에 따른 종료 코드
exit $failed_count