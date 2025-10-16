# AWS 배포 가이드

## 🚀 배포 방법

### 1. AWS ECS (Elastic Container Service) 배포

#### 사전 준비
```bash
# AWS CLI 설치 및 설정
aws configure

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com
```

#### Docker 이미지 빌드 및 푸시
```bash
# 이미지 빌드
docker build -t mindbuddy:latest .

# ECR 태그
docker tag mindbuddy:latest [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/mindbuddy:latest

# ECR 푸시
docker push [계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/mindbuddy:latest
```

#### ECS 작업 정의 생성
```json
{
  "family": "mindbuddy-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "mindbuddy-app",
      "image": "[계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/mindbuddy:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "5000"}
      ],
      "secrets": [
        {"name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mindbuddy",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

### 2. AWS Elastic Beanstalk 배포

#### Dockerrun.aws.json 생성
```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "[계정ID].dkr.ecr.ap-northeast-2.amazonaws.com/mindbuddy:latest",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 5000,
      "HostPort": 5000
    }
  ],
  "Logging": "/var/log/nginx"
}
```

#### 배포 명령
```bash
# EB CLI 설치
pip install awsebcli

# 초기화
eb init -p docker mindbuddy --region ap-northeast-2

# 환경 생성
eb create mindbuddy-prod

# 배포
eb deploy
```

---

### 3. AWS EC2 직접 배포

#### EC2 인스턴스 설정
```bash
# Docker 설치
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 프로젝트 클론
git clone https://github.com/humanaid-digital/Mindbuddy_Psychological-counseling.git
cd Mindbuddy_Psychological-counseling

# 환경변수 설정
cp .env.example .env
nano .env

# 실행
docker-compose -f docker-compose.aws.yml up -d
```

---

## 🔧 환경변수 설정

### AWS Secrets Manager 사용 (권장)
```bash
# 시크릿 생성
aws secretsmanager create-secret \
  --name mindbuddy/prod \
  --secret-string '{
    "MONGODB_URI": "mongodb://...",
    "JWT_SECRET": "...",
    "EMAIL_USER": "...",
    "EMAIL_PASS": "..."
  }'
```

### 필수 환경변수
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI` - MongoDB 연결 문자열
- `JWT_SECRET` - JWT 시크릿 키
- `EMAIL_HOST` - 이메일 호스트
- `EMAIL_PORT` - 이메일 포트
- `EMAIL_USER` - 이메일 사용자
- `EMAIL_PASS` - 이메일 비밀번호
- `CONTACT_EMAIL` - 문의 수신 이메일

---

## 📊 모니터링

### CloudWatch 로그 설정
```bash
# 로그 그룹 생성
aws logs create-log-group --log-group-name /ecs/mindbuddy

# 로그 스트림 생성
aws logs create-log-stream \
  --log-group-name /ecs/mindbuddy \
  --log-stream-name mindbuddy-app
```

### 헬스체크 엔드포인트
- `GET /health` - 서버 상태 확인

---

## 🔒 보안 체크리스트

- [ ] 환경변수를 Secrets Manager에 저장
- [ ] Security Group에서 필요한 포트만 오픈 (5000, 80, 443)
- [ ] IAM 역할 최소 권한 원칙 적용
- [ ] SSL/TLS 인증서 설정 (ACM 사용)
- [ ] WAF 설정 (선택사항)
- [ ] CloudWatch 알람 설정
- [ ] 자동 백업 설정 (MongoDB)

---

## 🐛 문제 해결

### 컨테이너가 시작되지 않는 경우
```bash
# 로그 확인
docker logs mindbuddy-app

# ECS 로그 확인
aws logs tail /ecs/mindbuddy --follow
```

### 데이터베이스 연결 실패
- Security Group 확인
- MongoDB URI 확인
- VPC 설정 확인

### 메모리 부족
- ECS 작업 정의에서 메모리 증가
- 또는 EC2 인스턴스 타입 업그레이드

---

## 📈 성능 최적화

1. **Auto Scaling 설정**
   - CPU 사용률 기반 스케일링
   - 최소 2개, 최대 10개 인스턴스

2. **CloudFront CDN 사용**
   - 정적 파일 캐싱
   - 전 세계 배포

3. **RDS 사용 (선택사항)**
   - MongoDB Atlas 또는 DocumentDB 사용
   - 자동 백업 및 복제

4. **ElastiCache 사용**
   - Redis 세션 저장
   - API 응답 캐싱

---

## 💰 예상 비용 (월간)

### 최소 구성
- ECS Fargate (0.5 vCPU, 1GB): ~$15
- ALB: ~$20
- MongoDB Atlas (M10): ~$60
- 총: **~$95/월**

### 권장 구성
- ECS Fargate (1 vCPU, 2GB) x2: ~$60
- ALB: ~$20
- RDS/DocumentDB: ~$100
- ElastiCache: ~$15
- CloudFront: ~$10
- 총: **~$205/월**
