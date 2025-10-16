const ApiResponse = require('../../utils/response');

describe('ApiResponse Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('should return success response with default values', () => {
      ApiResponse.success(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '요청이 성공적으로 처리되었습니다.',
        data: null,
        timestamp: expect.any(String)
      });
    });

    it('should return success response with custom data and message', () => {
      const testData = { id: 1, name: 'test' };
      const testMessage = '테스트 성공';

      ApiResponse.success(mockRes, testData, testMessage, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: testMessage,
        data: testData,
        timestamp: expect.any(String)
      });
    });
  });

  describe('error', () => {
    it('should return error response with default values', () => {
      ApiResponse.error(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '요청 처리 중 오류가 발생했습니다.',
        timestamp: expect.any(String)
      });
    });

    it('should return error response with custom values', () => {
      const testMessage = '테스트 에러';
      const testCode = 'TEST_ERROR';
      const testErrors = ['error1', 'error2'];

      ApiResponse.error(mockRes, testMessage, 400, testCode, testErrors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: testMessage,
        code: testCode,
        errors: testErrors,
        timestamp: expect.any(String)
      });
    });
  });

  describe('validationError', () => {
    it('should return validation error response', () => {
      const errors = [
        { field: 'email', message: '이메일이 필요합니다' },
        { field: 'password', message: '비밀번호가 필요합니다' }
      ];

      ApiResponse.validationError(mockRes, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '입력 정보를 확인해주세요.',
        code: 'VALIDATION_ERROR',
        errors: errors,
        timestamp: expect.any(String)
      });
    });
  });

  describe('authError', () => {
    it('should return auth error response with default values', () => {
      ApiResponse.authError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '인증이 필요합니다.',
        code: 'AUTH_REQUIRED',
        timestamp: expect.any(String)
      });
    });

    it('should return auth error response with custom values', () => {
      const testMessage = '토큰이 만료되었습니다';
      const testCode = 'TOKEN_EXPIRED';

      ApiResponse.authError(mockRes, testMessage, testCode);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: testMessage,
        code: testCode,
        timestamp: expect.any(String)
      });
    });
  });

  describe('notFoundError', () => {
    it('should return not found error response', () => {
      ApiResponse.notFoundError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.',
        code: 'NOT_FOUND',
        timestamp: expect.any(String)
      });
    });
  });

  describe('paginated', () => {
    it('should return paginated response', () => {
      const testData = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        totalPages: 5,
        totalItems: 50,
        limit: 10
      };

      ApiResponse.paginated(mockRes, testData, pagination);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '데이터를 성공적으로 조회했습니다.',
        data: testData,
        pagination: {
          currentPage: 1,
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
          hasNext: true,
          hasPrev: false
        },
        timestamp: expect.any(String)
      });
    });
  });
});