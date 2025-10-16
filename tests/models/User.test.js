const User = require('../../models/User');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid client user', async () => {
      const userData = {
        name: '김상담',
        email: 'client@test.com',
        password: 'password123',
        phone: '010-1234-5678',
        role: 'client'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('client');
      expect(savedUser.password).not.toBe(userData.password); // 해싱 확인
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.isVerified).toBe(false);
    });

    it('should create a valid counselor user', async () => {
      const userData = {
        name: '이상담',
        email: 'counselor@test.com',
        password: 'password123',
        phone: '010-5678-9012',
        role: 'counselor'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('counselor');
      expect(savedUser.name).toBe(userData.name);
    });

    it('should fail to create user without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user with invalid email', async () => {
      const userData = {
        name: '테스트',
        email: 'invalid-email',
        password: 'password123',
        phone: '010-1234-5678'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        name: '테스트1',
        email: 'duplicate@test.com',
        password: 'password123',
        phone: '010-1234-5678'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User({
        ...userData,
        name: '테스트2'
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        name: '테스트',
        email: 'test@example.com',
        password: 'password123',
        phone: '010-1234-5678'
      });
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    it('should not include password in JSON output', () => {
      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.name).toBe('테스트');
    });

    it('should update updatedAt on save', async () => {
      const originalUpdatedAt = user.updatedAt;
      
      // 시간 차이를 위해 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.name = '수정된 이름';
      await user.save();
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Validation', () => {
    it('should validate phone number format', async () => {
      const userData = {
        name: '테스트',
        email: 'test@example.com',
        password: 'password123',
        phone: 'invalid-phone'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate password length', async () => {
      const userData = {
        name: '테스트',
        email: 'test@example.com',
        password: '123', // 너무 짧음
        phone: '010-1234-5678'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate name length', async () => {
      const userData = {
        name: 'a'.repeat(51), // 너무 김
        email: 'test@example.com',
        password: 'password123',
        phone: '010-1234-5678'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });
});