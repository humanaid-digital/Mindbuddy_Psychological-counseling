# 성능 최적화 개선안

## 🚀 데이터베이스 최적화

### 인덱스 최적화
```javascript
// 복합 인덱스 추가 필요
db.bookings.createIndex({ "counselor": 1, "date": 1, "status": 1 })
db.users.createIndex({ "email": 1, "isActive": 1 })
db.counselors.createIndex({ "specialties": 1, "rating.average": -1, "fee": 1 })
```

### 쿼리 최적화
- Aggregation Pipeline 활용
- 불필요한 필드 제외 (projection)
- 페이지네이션 개선

## 📦 캐싱 전략

### Redis 캐싱 구현
```javascript
// 상담사 목록 캐싱 (5분)
const counselors = await redis.get('counselors:list');
if (!counselors) {
  const data = await Counselor.find().populate('user');
  await redis.setex('counselors:list', 300, JSON.stringify(data));
}
```

### 세션 캐싱
- 사용자 세션 Redis 저장
- 자주 조회되는 데이터 캐싱

## 🔄 API 최적화

### 응답 압축
```javascript
const compression = require('compression');
app.use(compression());
```

### 이미지 최적화
- WebP 형식 지원
- 이미지 리사이징
- CDN 연동