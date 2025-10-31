const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');

/**
 * AI 기반 상담사 매칭 엔진
 */

class CounselorMatchingEngine {
  constructor() {
    this.model = null;
    this.vectorizer = new natural.TfIdf();
    this.isInitialized = false;
  }

  /**
   * 매칭 엔진 초기화
   */
  async initialize() {
    try {
      // 사전 훈련된 모델 로드 (실제로는 훈련된 모델을 사용)
      await this.loadModel();
      
      // 텍스트 벡터화 준비
      await this.prepareVectorizer();
      
      this.isInitialized = true;
      console.log('🤖 AI 매칭 엔진 초기화 완료');
    } catch (error) {
      console.error('AI 매칭 엔진 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 모델 로드 (실제 환경에서는 훈련된 모델 사용)
   */
  async loadModel() {
    // 간단한 신경망 모델 생성 (실제로는 사전 훈련된 모델 로드)
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  /**
   * 텍스트 벡터화 준비
   */
  async prepareVectorizer() {
    // 상담 관련 키워드 사전 구축
    const counselingKeywords = [
      '우울', '불안', '스트레스', '트라우마', '관계', '가족',
      '직장', '학업', '자존감', '중독', '공황', '강박',
      '수면', '식이', '분노', '슬픔', '외로움', '소통'
    ];

    counselingKeywords.forEach(keyword => {
      this.vectorizer.addDocument(keyword);
    });
  }

  /**
   * 클라이언트 프로필 분석
   */
  analyzeClientProfile(clientData) {
    const features = {
      // 기본 정보
      age: this.normalizeAge(clientData.age),
      gender: this.encodeGender(clientData.gender),
      
      // 상담 관련 정보
      concerns: this.encodeConcerns(clientData.concerns),
      severity: this.assessSeverity(clientData.description),
      urgency: this.assessUrgency(clientData.description),
      
      // 선호도
      preferredMethod: this.encodeMethod(clientData.preferredMethod),
      preferredGender: this.encodeGender(clientData.preferredGender),
      budget: this.normalizeBudget(clientData.budget),
      
      // 텍스트 분석
      emotionalState: this.analyzeEmotionalState(clientData.description),
      communicationStyle: this.analyzeCommunicationStyle(clientData.description)
    };

    return features;
  }

  /**
   * 상담사 프로필 분석
   */
  analyzeCounselorProfile(counselorData) {
    const features = {
      // 기본 정보
      experience: this.normalizeExperience(counselorData.experience),
      specialties: this.encodeSpecialties(counselorData.specialties),
      methods: this.encodeMethods(counselorData.methods),
      
      // 성과 지표
      rating: counselorData.rating.average / 5.0,
      completionRate: counselorData.stats.completedSessions / 
                     (counselorData.stats.totalSessions || 1),
      
      // 가용성
      availability: this.calculateAvailability(counselorData.availability),
      fee: this.normalizeFee(counselorData.fee),
      
      // 성격 및 스타일 (상담사 소개글 분석)
      approachStyle: this.analyzeApproachStyle(counselorData.introduction),
      communicationStyle: this.analyzeCommunicationStyle(counselorData.introduction)
    };

    return features;
  }

  /**
   * 매칭 점수 계산
   */
  async calculateMatchingScore(clientFeatures, counselorFeatures) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 특성 벡터 생성
    const featureVector = this.createFeatureVector(clientFeatures, counselorFeatures);
    
    // 모델 예측
    const tensor = tf.tensor2d([featureVector]);
    const prediction = await this.model.predict(tensor);
    const score = await prediction.data();
    
    // 메모리 정리
    tensor.dispose();
    prediction.dispose();

    return score[0];
  }

  /**
   * 최적 상담사 추천
   */
  async recommendCounselors(clientData, availableCounselors, limit = 5) {
    const clientFeatures = this.analyzeClientProfile(clientData);
    const recommendations = [];

    for (const counselor of availableCounselors) {
      const counselorFeatures = this.analyzeCounselorProfile(counselor);
      const matchingScore = await this.calculateMatchingScore(clientFeatures, counselorFeatures);
      
      // 추가 규칙 기반 점수 조정
      const adjustedScore = this.applyBusinessRules(
        matchingScore, 
        clientData, 
        counselor
      );

      recommendations.push({
        counselor,
        matchingScore: adjustedScore,
        reasons: this.generateMatchingReasons(clientFeatures, counselorFeatures)
      });
    }

    // 점수순 정렬 및 상위 N개 반환
    return recommendations
      .sort((a, b) => b.matchingScore - a.matchingScore)
      .slice(0, limit);
  }

  /**
   * 비즈니스 규칙 적용
   */
  applyBusinessRules(baseScore, clientData, counselor) {
    let adjustedScore = baseScore;

    // 전문분야 일치도
    const specialtyMatch = this.calculateSpecialtyMatch(
      clientData.concerns, 
      counselor.specialties
    );
    adjustedScore += specialtyMatch * 0.3;

    // 예산 적합성
    if (counselor.fee <= clientData.budget) {
      adjustedScore += 0.1;
    } else {
      adjustedScore -= 0.2;
    }

    // 성별 선호도
    if (clientData.preferredGender === 'any' || 
        clientData.preferredGender === counselor.user.gender) {
      adjustedScore += 0.1;
    }

    // 상담 방식 일치
    if (counselor.methods.includes(clientData.preferredMethod)) {
      adjustedScore += 0.15;
    }

    // 평점 가중치
    adjustedScore += (counselor.rating.average / 5.0) * 0.2;

    // 경험 가중치
    const experienceBonus = Math.min(counselor.experience / 10, 1) * 0.1;
    adjustedScore += experienceBonus;

    return Math.min(adjustedScore, 1.0);
  }

  /**
   * 매칭 이유 생성
   */
  generateMatchingReasons(clientFeatures, counselorFeatures) {
    const reasons = [];

    // 전문분야 매칭
    if (this.hasSpecialtyMatch(clientFeatures.concerns, counselorFeatures.specialties)) {
      reasons.push('전문분야가 일치합니다');
    }

    // 경험 수준
    if (counselorFeatures.experience > 0.7) {
      reasons.push('풍부한 상담 경험을 보유하고 있습니다');
    }

    // 높은 평점
    if (counselorFeatures.rating > 0.8) {
      reasons.push('높은 고객 만족도를 기록하고 있습니다');
    }

    // 소통 스타일
    if (this.isCommunicationStyleMatch(clientFeatures, counselorFeatures)) {
      reasons.push('소통 스타일이 잘 맞을 것으로 예상됩니다');
    }

    return reasons;
  }

  // 유틸리티 메서드들
  normalizeAge(age) {
    return Math.min(age / 100, 1);
  }

  encodeGender(gender) {
    const mapping = { 'male': 0, 'female': 1, 'any': 0.5 };
    return mapping[gender] || 0.5;
  }

  encodeConcerns(concerns) {
    const concernMapping = {
      'depression': 0.1, 'anxiety': 0.2, 'trauma': 0.3,
      'relationship': 0.4, 'family': 0.5, 'work': 0.6,
      'self-esteem': 0.7, 'other': 0.8
    };
    
    return concerns.map(concern => concernMapping[concern] || 0).reduce((a, b) => a + b, 0) / concerns.length;
  }

  assessSeverity(description) {
    const severityKeywords = {
      high: ['심각', '극심', '견딜 수 없', '자해', '자살'],
      medium: ['힘들', '어려', '스트레스', '우울'],
      low: ['가끔', '때때로', '조금', '약간']
    };

    let score = 0.5; // 기본값

    for (const [level, keywords] of Object.entries(severityKeywords)) {
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
          switch (level) {
            case 'high': score = Math.max(score, 0.9); break;
            case 'medium': score = Math.max(score, 0.6); break;
            case 'low': score = Math.min(score, 0.3); break;
          }
        }
      }
    }

    return score;
  }

  assessUrgency(description) {
    const urgencyKeywords = ['급하', '빨리', '즉시', '응급', '위급'];
    return urgencyKeywords.some(keyword => description.includes(keyword)) ? 1.0 : 0.3;
  }

  createFeatureVector(clientFeatures, counselorFeatures) {
    return [
      clientFeatures.age,
      clientFeatures.gender,
      clientFeatures.concerns,
      clientFeatures.severity,
      clientFeatures.urgency,
      clientFeatures.preferredMethod,
      clientFeatures.preferredGender,
      clientFeatures.budget,
      clientFeatures.emotionalState,
      clientFeatures.communicationStyle,
      counselorFeatures.experience,
      counselorFeatures.specialties,
      counselorFeatures.methods,
      counselorFeatures.rating,
      counselorFeatures.completionRate,
      counselorFeatures.availability,
      counselorFeatures.fee,
      counselorFeatures.approachStyle,
      counselorFeatures.communicationStyle,
      Math.abs(clientFeatures.communicationStyle - counselorFeatures.communicationStyle)
    ];
  }

  // 추가 분석 메서드들...
  analyzeEmotionalState(text) {
    // 감정 분석 로직 (실제로는 더 정교한 NLP 모델 사용)
    const positiveWords = ['좋', '행복', '기쁨', '희망'];
    const negativeWords = ['슬프', '우울', '불안', '화'];
    
    let score = 0.5;
    positiveWords.forEach(word => {
      if (text.includes(word)) score += 0.1;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 0.1;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  analyzeCommunicationStyle(text) {
    // 소통 스타일 분석 (0: 직접적, 1: 간접적)
    const directWords = ['직접', '명확', '솔직'];
    const indirectWords = ['조심스럽', '천천히', '부드럽'];
    
    let score = 0.5;
    directWords.forEach(word => {
      if (text.includes(word)) score -= 0.1;
    });
    indirectWords.forEach(word => {
      if (text.includes(word)) score += 0.1;
    });
    
    return Math.max(0, Math.min(1, score));
  }
}

module.exports = CounselorMatchingEngine;