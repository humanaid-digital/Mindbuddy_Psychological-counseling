const express = require('express');
const cors = require('cors');
require('dotenv').config();

const MatchingEngine = require('./matching-engine');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize matching engine
const matchingEngine = new MatchingEngine();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-matching', timestamp: new Date().toISOString() });
});

// AI 매칭 엔드포인트
app.post('/api/match', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId || !preferences) {
      return res.status(400).json({ error: '사용자 ID와 선호도가 필요합니다.' });
    }

    const matches = await matchingEngine.findMatches(userId, preferences);
    
    res.json({
      success: true,
      matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('매칭 오류:', error);
    res.status(500).json({ error: '매칭 처리 중 오류가 발생했습니다.' });
  }
});

// 매칭 점수 계산
app.post('/api/calculate-score', async (req, res) => {
  try {
    const { userId, counselorId } = req.body;
    
    if (!userId || !counselorId) {
      return res.status(400).json({ error: '사용자 ID와 상담사 ID가 필요합니다.' });
    }

    const score = await matchingEngine.calculateCompatibilityScore(userId, counselorId);
    
    res.json({
      success: true,
      score,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('점수 계산 오류:', error);
    res.status(500).json({ error: '점수 계산 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`AI 매칭 서비스가 포트 ${PORT}에서 실행 중입니다.`);
});