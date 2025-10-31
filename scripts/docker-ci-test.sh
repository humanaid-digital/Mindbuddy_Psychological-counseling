#!/bin/bash

# CI/CD용 Docker Hub 테스트 스크립트 (GitHub Actions 등에서 사용)

set -e

# 색상 정의 (CI 환경에서는 비활성화)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

echo -e "${BLUE}🤖 CI/CD Docker Hub 테스트 시작${NC}"
echo ""

# 필수 환경 변수 확인
required_vars=("DOCKER_HUB_USERNAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ 필수 환경 변수 $var가 설정되지 않았습니다.${NC}"
        exit 1
    fi
done

# 기본값 설정
TAG=${TAG:-latest}
TIMEOUT=${TIMEOUT:-60}

echo -e "${YELLOW}📋 CI 테스트 정보:${NC}"
echo "  - Docker Hub 사용자: $DOCKER_HUB_USERNAME"
echo "  - 태그: $TAG"
echo "  - 타임아웃: ${TIMEOUT}초"
echo ""

# Docker 정보 확인
echo -e "${BLUE}🐳 Docker 환경 확인:${NC}"
docker --version
docker-compose --version
echo ""

# 기존 컨테이너 정리
echo -e "${BLUE}🧹 환경 정리:${NC}"
docker-compose -f docker-compose.hub.yml down -v --remove-orphans 2>/dev/null || true
docker system prune -f

# 이미지 풀
echo -e "${BLUE}📥 이미지 풀링:${NC}"
services=("app" "ai-matching" "sentiment" "frontend")

for service in "${services[@]}"; do
    image_name="$DOCKER_HUB_USERNAME/mindbuddy-$service:$TAG"
    echo "풀링: $image_name"
    
    if ! docker pull "$image_name"; then
        echo -e "${RED}❌ 이미지 풀 실패: $image_name${NC}"
        exit 1
    fi
done

# 서비스 시작
echo -e "${BLUE}🚀 서비스 시작:${NC}"
DOCKER_HUB_USERNAME="$DOCKER_HUB_USERNAME" TAG="$TAG" docker-compose -f docker-compose.hub.yml up -d

# 헬스 체크 대기
echo -e "${BLUE}⏳ 서비스 초기화 대기:${NC}"
sleep 20

# 헬스 체크 함수 (CI용)
check_service_health() {
    local service_name="$1"
    local url="$2"
    local max_attempts=$((TIMEOUT / 5))
    local attempt=1
    
    echo "헬스 체크: $service_name ($url)"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name: 정상${NC}"
            return 0
        fi
        
        echo "시도 $attempt/$max_attempts 실패, 5초 후 재시도..."
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name: 헬스 체크 실패${NC}"
    
    # 실패 시 로그 출력
    echo "=== $service_name 로그 ==="
    # 서비스명을 컨테이너명으로 매핑
    case "$service_name" in
        "app") container_name="app" ;;
        "frontend") container_name="frontend" ;;
        "ai-matching-service") container_name="ai-matching-service" ;;
        "sentiment-service") container_name="sentiment-service" ;;
        *) container_name="$service_name" ;;
    esac
    docker-compose -f docker-compose.hub.yml logs --tail=50 "$container_name" || true
    echo "=========================="
    
    return 1
}

# 서비스 상태 확인
echo -e "${BLUE}📊 서비스 상태:${NC}"
docker-compose -f docker-compose.hub.yml ps

# 헬스 체크 실행
echo -e "${BLUE}🔍 헬스 체크 실행:${NC}"

failed_services=()

if ! check_service_health "app" "http://localhost:5000/health"; then
    failed_services+=("app")
fi

if ! check_service_health "frontend" "http://localhost:3000/health"; then
    failed_services+=("frontend")
fi

if ! check_service_health "ai-matching-service" "http://localhost:3006/health"; then
    failed_services+=("ai-matching-service")
fi

if ! check_service_health "sentiment-service" "http://localhost:3007/health"; then
    failed_services+=("sentiment-service")
fi

# 결과 출력
echo ""
echo -e "${BLUE}📋 테스트 결과:${NC}"

if [ ${#failed_services[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 서비스 테스트 통과!${NC}"
    exit_code=0
else
    echo -e "${RED}❌ 실패한 서비스: ${failed_services[*]}${NC}"
    exit_code=1
    
    # 전체 로그 출력
    echo ""
    echo -e "${YELLOW}🔍 전체 서비스 로그:${NC}"
    docker-compose -f docker-compose.hub.yml logs --tail=100
fi

# 정리
echo -e "${BLUE}🧹 테스트 환경 정리:${NC}"
docker-compose -f docker-compose.hub.yml down -v

# 결과 요약
echo ""
echo -e "${BLUE}📊 최종 결과:${NC}"
if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ CI 테스트 성공${NC}"
else
    echo -e "${RED}❌ CI 테스트 실패${NC}"
fi

exit $exit_code