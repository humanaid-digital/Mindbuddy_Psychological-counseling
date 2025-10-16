/**
 * API 응답 표준화 유틸리티
 */

class ApiResponse {
  /**
   * 성공 응답
   * @param {Object} res - Express response object
   * @param {*} data - 응답 데이터
   * @param {string} message - 성공 메시지
   * @param {number} statusCode - HTTP 상태 코드
   */
  static success(res, data = null, message = '요청이 성공적으로 처리되었습니다.', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 에러 응답
   * @param {Object} res - Express response object
   * @param {string} message - 에러 메시지
   * @param {number} statusCode - HTTP 상태 코드
   * @param {string} code - 에러 코드
   * @param {*} errors - 상세 에러 정보
   */
  static error(res, message = '요청 처리 중 오류가 발생했습니다.', statusCode = 500, code = null, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (code) response.code = code;
    if (errors) response.errors = errors;

    return res.status(statusCode).json(response);
  }

  /**
   * 유효성 검사 에러 응답
   * @param {Object} res - Express response object
   * @param {Array} errors - 유효성 검사 에러 배열
   */
  static validationError(res, errors) {
    return this.error(
      res,
      '입력 정보를 확인해주세요.',
      400,
      'VALIDATION_ERROR',
      errors
    );
  }

  /**
   * 인증 에러 응답
   * @param {Object} res - Express response object
   * @param {string} message - 에러 메시지
   * @param {string} code - 에러 코드
   */
  static authError(res, message = '인증이 필요합니다.', code = 'AUTH_REQUIRED') {
    return this.error(res, message, 401, code);
  }

  /**
   * 권한 에러 응답
   * @param {Object} res - Express response object
   * @param {string} message - 에러 메시지
   */
  static forbiddenError(res, message = '접근 권한이 없습니다.') {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  /**
   * 리소스 없음 에러 응답
   * @param {Object} res - Express response object
   * @param {string} message - 에러 메시지
   */
  static notFoundError(res, message = '요청한 리소스를 찾을 수 없습니다.') {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

  /**
   * 페이지네이션 응답
   * @param {Object} res - Express response object
   * @param {Array} data - 데이터 배열
   * @param {Object} pagination - 페이지네이션 정보
   * @param {string} message - 성공 메시지
   */
  static paginated(res, data, pagination, message = '데이터를 성공적으로 조회했습니다.') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.limit,
        hasNext: pagination.page < pagination.totalPages,
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ApiResponse;