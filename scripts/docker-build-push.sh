#!/bin/bash

# Docker Hub 빌드 및 푸시 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 MindBuddy Docker Hub 빌드 및 푸시 스크립트${NC}"
echo ""

# Docker Hub 사용자명 확인
if [ -z "$DOCKER_HUB_USERNAME" ]; then
    read -p "Docker Hub 사용자명을 입력하세요: " DOCKER_HUB_USERNAME
    export DOCKER_HUB_USERNAME
fi

# 태그 설정
if [ -z "$TAG" ]; then
    TAG="latest"
    read -p "이미지 태그를 입력하세요 (기본값: latest): " input_tag
    if [ ! -z "$input_tag" ]; then
        TAG="$input_tag"
    fi
fi

echo -e "${YELLOW}📋 빌드 정보:${NC}"
echo "  - Docker Hub 사용자: $DOCKER_HUB_USERNAME"
echo "  - 태그: $TAG"
echo ""

# Docker 로그인 확인
echo -e "${BLUE}🔐 Docker Hub 로그인 확인 중...${NC}"
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Docker Hub에 로그인이 필요합니다.${NC}"
    docker login
fi

# 빌드할 서비스 목록
services=("app" "ai-matching" "sentiment" "frontend")
contexts=("." "services/ai-matching" "services/sentiment-analysis" "frontend")
dockerfiles=("Dockerfile.backend" "Dockerfile" "Dockerfile" "Dockerfile")

echo -e "${BLUE}🔨 이미지 빌드 시작...${NC}"
echo ""

for i in "${!services[@]}"; do
    service="${services[$i]}"
    context="${contexts[$i]}"
    dockerfile="${dockerfiles[$i]}"
    image_name="$DOCKER_HUB_USERNAME/mindbuddy-$service:$TAG"
    
    echo -e "${YELLOW}📦 $service 서비스 빌드 중...${NC}"
    echo "  - 컨텍스트: $context"
    echo "  - Dockerfile: $dockerfile"
    echo "  - 이미지명: $image_name"
    
    if docker build -f "$context/$dockerfile" -t "$image_name" "$context"; then
        echo -e "${GREEN}✅ $service 빌드 완료${NC}"
    else
        echo -e "${RED}❌ $service 빌드 실패${NC}"
        exit 1
    fi
    echo ""
done

echo -e "${BLUE}📤 Docker Hub에 이미지 푸시 중...${NC}"
echo ""

for service in "${services[@]}"; do
    image_name="$DOCKER_HUB_USERNAME/mindbuddy-$service:$TAG"
    
    echo -e "${YELLOW}⬆️  $service 푸시 중...${NC}"
    if docker push "$image_name"; then
        echo -e "${GREEN}✅ $service 푸시 완료${NC}"
    else
        echo -e "${RED}❌ $service 푸시 실패${NC}"
        exit 1
    fi
    echo ""
done

# latest 태그도 푸시 (태그가 latest가 아닌 경우)
if [ "$TAG" != "latest" ]; then
    echo -e "${BLUE}🏷️  latest 태그 생성 및 푸시...${NC}"
    
    for service in "${services[@]}"; do
        source_image="$DOCKER_HUB_USERNAME/mindbuddy-$service:$TAG"
        latest_image="$DOCKER_HUB_USERNAME/mindbuddy-$service:latest"
        
        echo -e "${YELLOW}🏷️  $service latest 태그 생성...${NC}"
        docker tag "$source_image" "$latest_image"
        
        echo -e "${YELLOW}⬆️  $service latest 푸시...${NC}"
        docker push "$latest_image"
    done
fi

echo ""
echo -e "${GREEN}🎉 모든 이미지가 성공적으로 Docker Hub에 푸시되었습니다!${NC}"
echo ""
echo -e "${BLUE}📋 푸시된 이미지 목록:${NC}"
for service in "${services[@]}"; do
    echo "  - $DOCKER_HUB_USERNAME/mindbuddy-$service:$TAG"
    if [ "$TAG" != "latest" ]; then
        echo "  - $DOCKER_HUB_USERNAME/mindbuddy-$service:latest"
    fi
done

echo ""
echo -e "${BLUE}🚀 테스트 실행 방법:${NC}"
echo "  export DOCKER_HUB_USERNAME=$DOCKER_HUB_USERNAME"
echo "  export TAG=$TAG"
echo "  docker-compose -f docker-compose.hub.yml up -d"
echo ""
echo -e "${BLUE}🔍 이미지 확인:${NC}"
echo "  docker images | grep $DOCKER_HUB_USERNAME"