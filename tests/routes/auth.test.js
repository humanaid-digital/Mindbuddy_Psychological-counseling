const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Counselor = require('../../models/Counselor');
const authRoutes = require('../../routes/auth');

// Express 앱 설정
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register/client', () => {
    it('should register a new client successfully', async () => {
      const userData = {
        name: '김상담',
        email: 'client@test.com',
        password: 'password123',
        phone: '010-1234-5678',
        concerns: ['anxiety', 'depression'],
        preferredMethod: 'video',
        preferredGender: 'any'
      };

      const response = await request(app)
        .post('/api/auth/register/client')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('client');
      expect(response.body.data.token).toBeDefined();

      // 데이터베이스에 저장되었는지 확인
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.name).toBe(userData.name);
    });

    it('should fail with invalid email', async () => {
      const userData = {
        name: '테스트',
        email: 'invalid-email',
        password: 'password123',
        phone: '010-1234-5678'
      };

      const response = await request(app)
        .post('/api/auth/register/client')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: '테스트1',
        email: 'duplicate@test.com',
        password: 'password123',
        phone: '010-1234-5678'
      };

      // 첫 번째 사용자 등록
      await request(app)
        .post('/api/auth/register/client')
        .send(userData)
        .expect(201);

      // 같은 이메일로 두 번째 사용자 등록 시도
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({ ...userData, name: '테스트2' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이미 등록된 이메일');
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        name: '테스트'
        // email, password, phone 누락
      };

      const response = await request(app)
        .post('/api/auth/register/client')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/register/counselor', () => {
    it('should register a new counselor successfully', async () => {
      const userData = {
        name: '이상담',
        email: 'counselor@test.com',
        password: 'password123',
        phone: '010-5678-9012',
        license: 'clinical',
        licenseNumber: 'CL-2024-001',
        university: '서울대학교 심리학과',
        experience: 5,
        specialties: ['depression', 'anxiety'],
        fee: 80000,
        methods: ['video', 'voice'],
        introduction: '안녕하세요. 전문 상담사입니다.'
      };

      const response = await request(app)
        .post('/api/auth/register/counselor')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe('counselor');
      expect(response.body.data.counselor.status).toBe('pending');

      // 데이터베이스에 저장되었는지 확인
      const savedUser = await User.findOne({ email: userData.email });
      const savedCounselor = await Counselor.findOne({ user: savedUser._id });
      
      expect(savedUser).toBeTruthy();
      expect(savedCounselor).toBeTruthy();
      expect(savedCounselor.license).toBe(userData.license);
    });

    it('should fail with invalid counselor data', async () => {
      const userData = {
        name: '이상담',
        email: 'counselor@test.com',
        password: 'password123',
        phone: '010-5678-9012',
        // 필수 상담사 정보 누락
      };

      const response = await request(app)
        .post('/api/auth/register/counselor')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // 테스트용 사용자 생성
      testUser = new User({
        name: '테스트',
        email: 'test@example.com',
        password: 'password123',
        phone: '010-1234-5678',
        role: 'client'
      });
      await testUser.save();
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        userType: 'client'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should fail with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
        userType: 'client'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('이메일 또는 비밀번호');
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
        userType: 'client'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let token;

    beforeEach(async () => {
      // 테스트용 사용자 생성 및 토큰 발급
      testUser = new User({
        name: '테스트',
        email: 'test@example.com',
        password: 'password123',
        phone: '010-1234-5678',
        role: 'client'
      });
      await testUser.save();

      const jwt = require('jsonwebtoken');
      token = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET);
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});