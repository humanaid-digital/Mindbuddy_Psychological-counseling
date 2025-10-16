# AWS 배포용 최적화된 Dockerfile
FROM node:18-alpine AS base

# 보안 업데이트
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치 단계
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 빌드 단계
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .

# 프로덕션 단계
FROM base AS production

# 비루트 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 의존성 복사
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# 애플리케이션 파일 복사
COPY --chown=nodejs:nodejs . .

# 필요한 디렉토리 생성
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs logs uploads

# 비루트 사용자로 전환
USER nodejs

# 환경변수 설정
ENV NODE_ENV=production \
    PORT=5000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 5000

# dumb-init 사용하여 시그널 처리 개선
CMD ["dumb-init", "node", "server.js"]
