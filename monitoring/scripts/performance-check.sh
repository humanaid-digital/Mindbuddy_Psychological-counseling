#!/bin/bash

# MindBuddy 성능 모니터링 스크립트

echo "🚀 MindBuddy 성능 모니터링 시작..."

# 1. 애플리케이션 상태 확인
echo "📊 애플리케이션 상태 확인..."
curl -s http://localhost:5000/health | jq '.'

# 2. 성능 테스트 실행
echo "⚡ 성능 테스트 실행..."
node ../scripts/performance-test.js http://localhost:5000

# 3. 메트릭 수집
echo "📈 메트릭 수집..."
curl -s http://localhost:5000/metrics > /tmp/mindbuddy-metrics.txt
echo "메트릭이 /tmp/mindbuddy-metrics.txt에 저장되었습니다."

# 4. 로그 분석
echo "📋 최근 에러 로그 확인..."
tail -n 50 ../logs/error.log | grep -i error || echo "에러 없음"

# 5. 리소스 사용량 확인
echo "💾 리소스 사용량 확인..."
echo "메모리 사용량:"
ps aux | grep node | grep -v grep | awk '{print $6/1024 " MB"}'

echo "CPU 사용량:"
ps aux | grep node | grep -v grep | awk '{print $3 "%"}'

# 6. 데이터베이스 상태 확인
echo "🗄️ 데이터베이스 상태 확인..."
mongo --eval "db.runCommand({serverStatus: 1})" --quiet | jq '.connections'

echo "✅ 모니터링 완료!"