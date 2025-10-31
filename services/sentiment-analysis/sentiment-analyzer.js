const natural = require('natural');
const tf = require('@tensorflow/tfjs-node');

/**
 * 실시간 감정 분석 서비스
 */

class SentimentAnalyzer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmerKo || natural.PorterStemmer;
    this.model = null;
    this.vocabulary = new Map();
    this.isInitialized = false;
  }

  /**
   * 감정 분석기 초기화
   */
  async initialize() {
    try {
      await this.loadModel();
      await this.loadVocabulary();
      this.isInitialized = true;
      console.log('🧠 감정 분석기 초기화 완료');
    } catch (error) {
      console.error('감정 분석기 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 사전 훈련된 모델 로드
   */
  async loadModel() {
    // 실제 환경에서는 훈련된 모델을 로드
    this.model = tf.sequential({
      layers: [
        tf.layers.embedding({ inputDim: 10000, outputDim: 128, inputLength: 100 }),
        tf.layers.lstm({ units: 64, dropout: 0.2, recurrentDropout: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // positive, negative, neutral
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  /**
   * 어휘 사전 로드
   */
  async loadVocabulary() {
    // 한국어 감정 어휘 사전
    const emotionWords = {
      positive: [
        '좋다', '행복하다', '기쁘다', '만족하다', '편안하다', '안정되다',
        '희망적이다', '긍정적이다', '감사하다', '사랑하다', '즐겁다'
      ],
      negative: [
        '슬프다', '우울하다', '불안하다', '화나다', '스트레스', '힘들다',
        '절망적이다', '외롭다', '무서워하다', '걱정되다', '짜증나다'
      ],
      neutral: [
        '그냥', '보통', '평범하다', '일반적이다', '그저', '단순히'
      ]
    };

    let index = 1; // 0은 패딩용
    for (const [sentiment, words] of Object.entries(emotionWords)) {
      for (const word of words) {
        this.vocabulary.set(word, { index: index++, sentiment });
      }
    }
  }

  /**
   * 텍스트 전처리
   */
  preprocessText(text) {
    // 텍스트 정규화
    let processed = text.toLowerCase();
    
    // 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
    processed = processed.replace(/[^가-힣a-z0-9\s]/g, ' ');
    
    // 토큰화
    const tokens = this.tokenizer.tokenize(processed);
    
    // 불용어 제거
    const stopWords = ['은', '는', '이', '가', '을', '를', '에', '의', '와', '과'];
    const filteredTokens = tokens.filter(token => !stopWords.includes(token));
    
    // 어간 추출
    const stemmedTokens = filteredTokens.map(token => this.stemmer.stem(token));
    
    return stemmedTokens;
  }

  /**
   * 텍스트를 숫자 시퀀스로 변환
   */
  textToSequence(tokens, maxLength = 100) {
    const sequence = tokens.map(token => {
      const vocabEntry = this.vocabulary.get(token);
      return vocabEntry ? vocabEntry.index : 0; // 0은 unknown token
    });

    // 패딩 또는 자르기
    if (sequence.length < maxLength) {
      return [...sequence, ...Array(maxLength - sequence.length).fill(0)];
    } else {
      return sequence.slice(0, maxLength);
    }
  }

  /**
   * 감정 분석 수행
   */
  async analyzeSentiment(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 텍스트 전처리
    const tokens = this.preprocessText(text);
    const sequence = this.textToSequence(tokens);

    // 모델 예측
    const inputTensor = tf.tensor2d([sequence]);
    const prediction = await this.model.predict(inputTensor);
    const probabilities = await prediction.data();

    // 메모리 정리
    inputTensor.dispose();
    prediction.dispose();

    // 결과 해석
    const sentiments = ['positive', 'negative', 'neutral'];
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[maxIndex];

    // 추가 분석
    const emotionDetails = this.analyzeEmotionDetails(tokens);
    const riskLevel = this.assessRiskLevel(text, probabilities);

    return {
      sentiment: sentiments[maxIndex],
      confidence: confidence,
      probabilities: {
        positive: probabilities[0],
        negative: probabilities[1],
        neutral: probabilities[2]
      },
      emotionDetails,
      riskLevel,
      keywords: this.extractEmotionKeywords(tokens),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 세부 감정 분석
   */
  analyzeEmotionDetails(tokens) {
    const emotions = {
      joy: 0, sadness: 0, anger: 0, fear: 0, 
      surprise: 0, disgust: 0, anxiety: 0, depression: 0
    };

    const emotionKeywords = {
      joy: ['기쁘다', '행복하다', '즐겁다', '웃다', '만족하다'],
      sadness: ['슬프다', '우울하다', '눈물', '울다', '서럽다'],
      anger: ['화나다', '짜증나다', '분노하다', '열받다', '성나다'],
      fear: ['무섭다', '두렵다', '걱정되다', '불안하다', '떨리다'],
      anxiety: ['불안하다', '초조하다', '걱정되다', '긴장되다'],
      depression: ['우울하다', '절망적이다', '무기력하다', '의욕없다']
    };

    for (const token of tokens) {
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(keyword => token.includes(keyword.slice(0, -1)))) {
          emotions[emotion] += 1;
        }
      }
    }

    // 정규화
    const total = Object.values(emotions).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const emotion in emotions) {
        emotions[emotion] = emotions[emotion] / total;
      }
    }

    return emotions;
  }

  /**
   * 위험도 평가
   */
  assessRiskLevel(text, probabilities) {
    let riskScore = 0;

    // 부정적 감정 강도
    riskScore += probabilities[1] * 0.4; // negative probability

    // 위험 키워드 검사
    const highRiskKeywords = [
      '자살', '죽고싶다', '사라지고싶다', '끝내고싶다',
      '자해', '상처내다', '베다', '때리다'
    ];

    const mediumRiskKeywords = [
      '절망적', '희망없다', '의미없다', '포기하다',
      '혼자', '외롭다', '아무도', '도움없다'
    ];

    for (const keyword of highRiskKeywords) {
      if (text.includes(keyword)) {
        riskScore += 0.3;
      }
    }

    for (const keyword of mediumRiskKeywords) {
      if (text.includes(keyword)) {
        riskScore += 0.1;
      }
    }

    // 위험도 레벨 결정
    if (riskScore >= 0.7) {
      return { level: 'high', score: riskScore, action: 'immediate_intervention' };
    } else if (riskScore >= 0.4) {
      return { level: 'medium', score: riskScore, action: 'counselor_alert' };
    } else {
      return { level: 'low', score: riskScore, action: 'monitor' };
    }
  }

  /**
   * 감정 키워드 추출
   */
  extractEmotionKeywords(tokens) {
    const keywords = [];
    
    for (const token of tokens) {
      const vocabEntry = this.vocabulary.get(token);
      if (vocabEntry) {
        keywords.push({
          word: token,
          sentiment: vocabEntry.sentiment
        });
      }
    }

    return keywords;
  }

  /**
   * 실시간 감정 모니터링
   */
  async monitorConversation(sessionId, messages) {
    const results = [];
    
    for (const message of messages) {
      const analysis = await this.analyzeSentiment(message.content);
      
      results.push({
        messageId: message.id,
        sessionId: sessionId,
        sender: message.sender,
        analysis: analysis,
        timestamp: message.timestamp
      });

      // 위험 상황 감지 시 알림
      if (analysis.riskLevel.level === 'high') {
        await this.triggerEmergencyAlert(sessionId, message, analysis);
      } else if (analysis.riskLevel.level === 'medium') {
        await this.notifyCounselor(sessionId, message, analysis);
      }
    }

    return results;
  }

  /**
   * 응급 상황 알림
   */
  async triggerEmergencyAlert(sessionId, message, analysis) {
    console.log(`🚨 응급 상황 감지 - 세션 ${sessionId}`);
    
    // 상담사에게 즉시 알림
    // 관리자에게 알림
    // 필요시 전문 기관 연계
    
    const alert = {
      type: 'emergency',
      sessionId: sessionId,
      message: message.content,
      riskLevel: analysis.riskLevel,
      timestamp: new Date().toISOString(),
      action: 'immediate_intervention_required'
    };

    // 실제 구현에서는 알림 서비스로 전송
    return alert;
  }

  /**
   * 상담사 알림
   */
  async notifyCounselor(sessionId, message, analysis) {
    console.log(`⚠️ 주의 상황 감지 - 세션 ${sessionId}`);
    
    const notification = {
      type: 'counselor_alert',
      sessionId: sessionId,
      riskLevel: analysis.riskLevel,
      suggestions: this.generateCounselorSuggestions(analysis),
      timestamp: new Date().toISOString()
    };

    return notification;
  }

  /**
   * 상담사 제안 생성
   */
  generateCounselorSuggestions(analysis) {
    const suggestions = [];

    if (analysis.emotionDetails.sadness > 0.5) {
      suggestions.push('클라이언트가 깊은 슬픔을 표현하고 있습니다. 공감적 경청이 필요합니다.');
    }

    if (analysis.emotionDetails.anxiety > 0.5) {
      suggestions.push('불안 수준이 높습니다. 안정감을 주는 대화가 도움이 될 것입니다.');
    }

    if (analysis.emotionDetails.anger > 0.5) {
      suggestions.push('분노 감정이 감지됩니다. 감정 조절 기법을 제안해보세요.');
    }

    if (analysis.confidence < 0.6) {
      suggestions.push('감정 상태가 불분명합니다. 더 구체적인 질문을 통해 탐색해보세요.');
    }

    return suggestions;
  }

  /**
   * 감정 트렌드 분석
   */
  analyzeTrend(sessionAnalyses) {
    const timeline = sessionAnalyses.map(analysis => ({
      timestamp: analysis.timestamp,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      riskScore: analysis.riskLevel.score
    }));

    // 감정 변화 패턴 분석
    const sentimentTrend = this.calculateTrend(timeline.map(t => 
      t.sentiment === 'positive' ? 1 : t.sentiment === 'negative' ? -1 : 0
    ));

    const riskTrend = this.calculateTrend(timeline.map(t => t.riskScore));

    return {
      sentimentTrend: sentimentTrend > 0 ? 'improving' : sentimentTrend < 0 ? 'declining' : 'stable',
      riskTrend: riskTrend > 0 ? 'increasing' : riskTrend < 0 ? 'decreasing' : 'stable',
      averageRisk: timeline.reduce((sum, t) => sum + t.riskScore, 0) / timeline.length,
      timeline: timeline
    };
  }

  /**
   * 트렌드 계산 (선형 회귀)
   */
  calculateTrend(values) {
    const n = values.length;
    if (n < 2) return 0;

    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}

module.exports = SentimentAnalyzer;