#!/bin/bash

# Docker 설정 및 실행 스크립트

set -e

echo "🐳 MindBuddy Docker 설정을 시작합니다..."

# 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "📝 .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "⚠️  .env 파일을 확인하고 필요한 값들을 설정하세요."
fi

# Docker 및 Docker Compose 설치 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다. Docker를 먼저 설치하세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되지 않았습니다. Docker Compose를 먼저 설치하세요."
    exit 1
fi

# Docker 서비스 실행 확인
if ! docker info &> /dev/null; then
    echo "❌ Docker 서비스가 실행되지 않았습니다. Docker를 시작하세요."
    exit 1
fi

# 실행 모드 선택
echo "🚀 실행 모드를 선택하세요:"
echo "1) 개발 모드 (기본 서비스만)"
echo "2) 전체 모드 (모니터링 포함)"
echo "3) 프로덕션 모드 (Nginx 포함)"
echo "4) 모놀리식 모드 (AI 서비스 제외)"

read -p "선택 (1-4): " choice

case $choice in
    1)
        echo "🔧 개발 모드로 실행합니다..."
        docker-compose up -d app postgres redis frontend
        ;;
    2)
        echo "📊 전체 모드로 실행합니다..."
        docker-compose --profile monitoring up -d
        ;;
    3)
        echo "🌐 프로덕션 모드로 실행합니다..."
        docker-compose --profile production --profile monitoring up -d
        ;;
    4)
        echo "🏗️ 모놀리식 모드로 실행합니다..."
        docker-compose -f docker-compose.monolith.yml up -d
        ;;
    *)
        echo "🔧 기본값으로 개발 모드를 실행합니다..."
        docker-compose up -d app postgres redis frontend
        ;;
esac

echo ""
echo "⏳ 서비스가 시작되기를 기다리는 중..."
sleep 10

# 서비스 상태 확인
echo ""
echo "📋 서비스 상태 확인:"
docker-compose ps

echo ""
echo "🔍 헬스 체크 수행 중..."

# 메인 앱 헬스 체크
if curl -f http://localhost:5000/health &> /dev/null; then
    echo "✅ 메인 애플리케이션: 정상"
else
    echo "❌ 메인 애플리케이션: 오류"
fi

# 프론트엔드 헬스 체크
if curl -f http://localhost:3000/health &> /dev/null; then
    echo "✅ 프론트엔드: 정상"
else
    echo "❌ 프론트엔드: 오류"
fi

# AI 서비스 헬스 체크 (실행 중인 경우)
if docker-compose ps | grep -q "mindbuddy-ai-matching.*Up"; then
    if curl -f http://localhost:3006/health &> /dev/null; then
        echo "✅ AI 매칭 서비스: 정상"
    else
        echo "❌ AI 매칭 서비스: 오류"
    fi
fi

if docker-compose ps | grep -q "mindbuddy-sentiment.*Up"; then
    if curl -f http://localhost:3007/health &> /dev/null; then
        echo "✅ 감정 분석 서비스: 정상"
    else
        echo "❌ 감정 분석 서비스: 오류"
    fi
fi

echo ""
echo "🎉 설정이 완료되었습니다!"
echo ""
echo "📱 접속 정보:"
echo "   - 프론트엔드: http://localhost:3000"
echo "   - API 서버: http://localhost:5000"
echo "   - 헬스 체크: http://localhost:5000/health"

if docker-compose ps | grep -q "mindbuddy-nginx.*Up"; then
    echo "   - Nginx (프록시): http://localhost"
fi

if docker-compose ps | grep -q "mindbuddy-kibana.*Up"; then
    echo "   - Kibana (로그): http://localhost:5601"
fi

echo ""
echo "🛠️ 유용한 명령어:"
echo "   - 로그 확인: docker-compose logs -f"
echo "   - 서비스 중지: docker-compose down"
echo "   - 재시작: docker-compose restart"
echo "   - 상태 확인: docker-compose ps"