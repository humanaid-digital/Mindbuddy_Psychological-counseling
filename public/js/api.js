// API 기본 설정
const API_BASE_URL = window.location.origin + '/api';

// API 클래스
class API {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // 기본 fetch 래퍼
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // 토큰이 있으면 Authorization 헤더 추가
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '요청 처리 중 오류가 발생했습니다');
      }

      return data;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // GET 요청
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  // POST 요청
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT 요청
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE 요청
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // 토큰 설정
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // 토큰 제거
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // 인증 관련 API
  auth = {
    // 상담자 회원가입
    registerClient: (userData) => this.post('/auth/register/client', userData),
    
    // 상담사 회원가입
    registerCounselor: (userData) => this.post('/auth/register/counselor', userData),
    
    // 로그인
    login: (credentials) => this.post('/auth/login', credentials),
    
    // 현재 사용자 정보
    me: () => this.get('/auth/me'),
    
    // 로그아웃
    logout: () => this.post('/auth/logout')
  };

  // 상담사 관련 API
  counselors = {
    // 상담사 목록 조회
    list: (params) => this.get('/counselors', params),
    
    // 상담사 상세 조회
    get: (id) => this.get(`/counselors/${id}`),
    
    // 상담사 가용시간 조회
    availability: (id, date) => this.get(`/counselors/${id}/availability`, { date }),
    
    // 상담사 프로필 수정
    updateProfile: (data) => this.put('/counselors/profile', data),
    
    // 상담사 통계
    stats: () => this.get('/counselors/dashboard/stats')
  };

  // 예약 관련 API
  bookings = {
    // 예약 생성
    create: (bookingData) => this.post('/bookings', bookingData),
    
    // 예약 목록 조회
    list: (params) => this.get('/bookings', params),
    
    // 예약 상세 조회
    get: (id) => this.get(`/bookings/${id}`),
    
    // 예약 확정
    confirm: (id) => this.put(`/bookings/${id}/confirm`),
    
    // 예약 취소
    cancel: (id, reason) => this.put(`/bookings/${id}/cancel`, { reason }),
    
    // 세션 시작
    start: (id) => this.put(`/bookings/${id}/start`)
  };

  // 세션 관련 API
  sessions = {
    // 세션 정보 조회
    get: (sessionId) => this.get(`/sessions/${sessionId}`),
    
    // 세션 종료
    end: (sessionId) => this.put(`/sessions/${sessionId}/end`)
  };

  // 리뷰 관련 API
  reviews = {
    // 리뷰 작성
    create: (reviewData) => this.post('/reviews', reviewData),
    
    // 상담사 리뷰 목록
    getByCounselor: (counselorId, params) => this.get(`/reviews/counselor/${counselorId}`, params)
  };

  // 사용자 관련 API
  users = {
    // 프로필 조회
    profile: () => this.get('/users/profile'),
    
    // 프로필 수정
    updateProfile: (data) => this.put('/users/profile', data)
  };

  // 관리자 관련 API
  admin = {
    // 대시보드 통계
    dashboard: () => this.get('/admin/dashboard'),
    
    // 대기 중인 상담사 목록
    pendingCounselors: (params) => this.get('/admin/counselors/pending', params),
    
    // 상담사 승인
    approveCounselor: (id) => this.put(`/admin/counselors/${id}/approve`),
    
    // 상담사 거절
    rejectCounselor: (id, reason) => this.put(`/admin/counselors/${id}/reject`, { reason })
  };
}

// 전역 API 인스턴스
const api = new API();

// 유틸리티 함수들
const utils = {
  // 로딩 표시
  showLoading: (element) => {
    if (element) {
      element.disabled = true;
      element.innerHTML = '<span class="loading">처리 중...</span>';
    }
  },

  // 로딩 해제
  hideLoading: (element, originalText) => {
    if (element) {
      element.disabled = false;
      element.innerHTML = originalText;
    }
  },

  // 에러 메시지 표시
  showError: (message, container) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: 5px;
      margin: 1rem 0;
      border: 1px solid #fcc;
    `;
    errorDiv.textContent = message;

    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
    } else {
      document.body.insertBefore(errorDiv, document.body.firstChild);
    }

    // 5초 후 자동 제거
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  },

  // 성공 메시지 표시
  showSuccess: (message, container) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      background: #efe;
      color: #363;
      padding: 1rem;
      border-radius: 5px;
      margin: 1rem 0;
      border: 1px solid #cfc;
    `;
    successDiv.textContent = message;

    if (container) {
      container.insertBefore(successDiv, container.firstChild);
    } else {
      document.body.insertBefore(successDiv, document.body.firstChild);
    }

    // 3초 후 자동 제거
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  },

  // 날짜 포맷팅
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('ko-KR');
  },

  // 시간 포맷팅
  formatTime: (time) => {
    return time;
  },

  // 가격 포맷팅
  formatPrice: (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  },

  // 평점 별표 생성
  generateStars: (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    if (hasHalfStar) {
      stars += '☆';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      stars += '☆';
    }

    return stars;
  },

  // 로그인 상태 확인
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // 사용자 역할 확인
  getUserRole: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).role : null;
  },

  // 로그인 페이지로 리다이렉트
  redirectToLogin: () => {
    window.location.href = '/login';
  },

  // 대시보드로 리다이렉트
  redirectToDashboard: (role) => {
    switch (role) {
      case 'client':
        window.location.href = '/client-dashboard';
        break;
      case 'counselor':
        window.location.href = '/counselor-dashboard';
        break;
      case 'admin':
        window.location.href = '/admin';
        break;
      default:
        window.location.href = '/';
    }
  }
};

// 페이지 로드 시 토큰 확인
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.setToken(token);
  }
});