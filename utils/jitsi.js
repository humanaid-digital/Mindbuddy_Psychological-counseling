const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JitsiMeetService {
  constructor() {
    this.domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    this.appId = process.env.JITSI_APP_ID || 'mindbuddy';
    this.jwtSecret = process.env.JITSI_JWT_SECRET;
  }

  /**
   * Jitsi Meet 룸 이름 생성
   * @param {string} sessionId - 세션 ID
   * @returns {string} 룸 이름
   */
  generateRoomName(sessionId) {
    // 세션 ID를 기반으로 고유한 룸 이름 생성
    const hash = crypto.createHash('md5').update(sessionId).digest('hex');
    return `mindbuddy-session-${hash.substring(0, 12)}`;
  }

  /**
   * Jitsi Meet JWT 토큰 생성 (선택사항 - 보안 강화용)
   * @param {string} roomName - 룸 이름
   * @param {Object} user - 사용자 정보
   * @returns {string} JWT 토큰
   */
  generateJWT(roomName, user) {
    if (!this.jwtSecret) {
      return null; // JWT 없이도 사용 가능
    }

    const payload = {
      iss: this.appId,
      aud: 'jitsi',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2시간 유효
      room: roomName,
      context: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e3a8a&color=fff`
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          'outbound-call': false
        }
      },
      moderator: user.role === 'counselor' // 상담사를 모더레이터로 설정
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Jitsi Meet 설정 객체 생성
   * @param {string} roomName - 룸 이름
   * @param {Object} user - 사용자 정보
   * @param {Object} options - 추가 옵션
   * @returns {Object} Jitsi Meet 설정
   */
  generateMeetingConfig(roomName, user, options = {}) {
    const config = {
      domain: this.domain,
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: null, // JavaScript에서 설정
      configOverwrite: {
        startWithAudioMuted: options.startWithAudioMuted || false,
        startWithVideoMuted: options.startWithVideoMuted || false,
        enableWelcomePage: false,
        enableClosePage: false,
        prejoinPageEnabled: false,
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        disableRemoteMute: user.role !== 'counselor',
        disableModeratorIndicator: false,
        startScreenSharing: false,
        enableEmailInStats: false,
        enableDisplayNameInStats: false,
        enableLipSync: false,
        disableThirdPartyRequests: true,
        disableLocalVideoFlip: false,
        backgroundAlpha: 0.5,
        // 심리상담에 적합한 설정
        toolbarButtons: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ].filter(button => {
          // 상담에 불필요한 기능 제거
          const allowedButtons = [
            'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection',
            'hangup', 'chat', 'settings', 'videobackgroundblur'
          ];
          return allowedButtons.includes(button);
        })
      },
      interfaceConfigOverwrite: {
        TOOLBAR_ALWAYS_VISIBLE: true,
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        APP_NAME: '마인드버디 상담',
        NATIVE_APP_NAME: '마인드버디',
        PROVIDER_NAME: 'Human_AI_D',
        LANG_DETECTION: true,
        CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
        CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
        CONNECTION_INDICATOR_DISABLED: false,
        VIDEO_LAYOUT_FIT: 'both',
        FILM_STRIP_MAX_HEIGHT: 120,
        TILE_VIEW_MAX_COLUMNS: 2,
        // 모바일 설정
        MOBILE_APP_PROMO: false,
        MOBILE_DOWNLOAD_LINK_ANDROID: '',
        MOBILE_DOWNLOAD_LINK_IOS: ''
      },
      userInfo: {
        displayName: user.name,
        email: user.email
      }
    };

    // JWT 토큰이 있으면 추가
    const jwtToken = this.generateJWT(roomName, user);
    if (jwtToken) {
      config.jwt = jwtToken;
    }

    return config;
  }

  /**
   * 세션 종료 후 정리 작업
   * @param {string} roomName - 룸 이름
   */
  async cleanupSession(roomName) {
    // 필요시 Jitsi Meet API를 통한 룸 정리 작업
    // 현재는 클라이언트 측에서 자동으로 정리됨
    console.log(`세션 정리: ${roomName}`);
  }

  /**
   * 세션 통계 수집 (선택사항)
   * @param {string} roomName - 룸 이름
   * @param {Object} stats - 통계 데이터
   */
  async collectSessionStats(roomName, stats) {
    // 세션 통계 수집 및 저장
    console.log(`세션 통계 수집: ${roomName}`, stats);
  }
}

module.exports = new JitsiMeetService();
