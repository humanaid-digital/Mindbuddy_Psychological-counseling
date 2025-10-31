const express = require('express');
const cors = require('cors');
require('dotenv').config();

const SentimentAnalyzer = require('./sentiment-analyzer');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize sentiment analyzer
const sentimentAnalyzer = new SentimentAnalyzer();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sentiment-analysis', timestamp: new Date().toISOString() });
});

// 감정 분석 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '분석할 텍스트가 필요합니다.' });
    }

    const analysis = await sentimentAnalyzer.analyzeSentiment(text);
    
    // 세션 ID가 있으면 실시간 모니터링 수행
    if (sessionId) {
      await sentimentAnalyzer.monitorRealTime(sessionId, text, analysis);
    }
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('감정 분석 오류:', error);
    res.status(500).json({ error: '감정 분석 중 오류가 발생했습니다.' });
  }
});

// 위험도 평가 엔드포인트
app.post('/api/assess-risk', async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '분석할 텍스트가 필요합니다.' });
    }

    const riskAssessment = await sentimentAnalyzer.assessRisk(text);
    
    res.json({
      success: true,
      riskAssessment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('위험도 평가 오류:', error);
    res.status(500).json({ error: '위험도 평가 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`감정 분석 서비스가 포트 ${PORT}에서 실행 중입니다.`);
});