// 런타임 설정 파일
window.APP_CONFIG = {
  API_URL: window.location.protocol + '//' + window.location.hostname + ':5000/api',
  SERVER_URL: window.location.protocol + '//' + window.location.hostname + ':5000',
  // Docker 환경에서는 nginx 프록시를 통해 접근
  USE_PROXY: true
};