const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// 미들웨어
app.use(express.json());
app.use(express.static('.'));

// 테스트 라우트
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// 로그인 API 테스트
app.post('/api/auth/login', (req, res) => {
  console.log('로그인 요청:', req.body);
  
  const { email, password, userType } = req.body;
  
  // 간단한 테스트 로그인
  if (email === 'client@test.com' && password === 'test123!') {
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        token: 'test-token-123',
        user: {
          id: '1',
          name: '김상담',
          email: email,
          role: 'client'
        }
      }
    });
  } else if (email === 'counselor@test.com' && password === 'test123!') {
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        token: 'test-token-456',
        user: {
          id: '2',
          name: '이상담',
          email: email,
          role: 'counselor'
        },
        counselor: {
          id: '1',
          status: 'approved'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '이메일 또는 비밀번호가 올바르지 않습니다'
    });
  }
});

// 회원가입 API 테스트
app.post('/api/auth/register/client', (req, res) => {
  console.log('상담자 회원가입 요청:', req.body);
  
  res.json({
    success: true,
    message: '회원가입이 완료되었습니다',
    data: {
      token: 'new-user-token-789',
      user: {
        id: '3',
        name: req.body.name,
        email: req.body.email,
        role: 'client'
      }
    }
  });
});

app.post('/api/auth/register/counselor', (req, res) => {
  console.log('상담사 회원가입 요청:', req.body);
  
  res.json({
    success: true,
    message: '상담사 가입 신청이 완료되었습니다',
    data: {
      user: {
        id: '4',
        name: req.body.name,
        email: req.body.email,
        role: 'counselor'
      },
      counselor: {
        id: '2',
        status: 'pending'
      }
    }
  });
});

// HTML 파일 서빙
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/client-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-register.html'));
});

app.get('/counselor-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'counselor-register.html'));
});

app.get('/test-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-login.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 테스트 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 테스트 페이지: http://localhost:${PORT}/test-login`);
});