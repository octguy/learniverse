export const AUTH_ERROR_MESSAGES: { [key: string]: string } = {
    // === Register (POST /api/v1/auth/register) ===
    'INVALID_REGISTER_PAYLOAD': 'Thông tin đăng ký không hợp lệ', // 400
    'EMAIL_ALREADY_IN_USE': 'Email đã tồn tại. Vui lòng dùng email khác.', // 409
    'ROLE_NOT_FOUND': 'Lỗi hệ thống.', // 500

    // === Login (POST /api/v1/auth/login) ===
    'VALIDATION_ERROR': 'Thông tin đăng nhập không hợp lệ', // 400
    'INVALID_CREDENTIALS': 'Email hoặc mật khẩu không đúng', // 401
    'USER_NOT_VERIFIED': 'Email chưa được xác thực.', // 402
    'BAD_CREDENTIALS': 'Email hoặc mật khẩu không đúng',


    // === Verify user (POST /api/v1/auth/verify) ===
    'INVALID_VERIFICATION_CODE': 'Mã xác thực không hợp lệ hoặc đã hết hạn', // 400
    'USER_NOT_FOUND': 'Người dùng không tồn tại', // 404
    'VERIFICATION_PROCESSING_FAILED': 'Lỗi hệ thống', // 500

    // === Resend verification code (POST /api/v1/auth/resend-verification) ===
    'USER_ALREADY_VERIFIED': 'Tài khoản đã được xác thực', // 400
    // USER_NOT_FOUND (404)
    'RESEND_PROCESSING_FAILED': 'Lỗi hệ thống', // 500

    // === Refresh token (POST /api/v1/auth/refresh-token) ===
    'REFRESH_TOKEN_MUST_NOT_BE_BLANK': 'Token không được để trống', // 400
    'REFRESH_TOKEN_INVALID': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', // 401
    'REFRESH_PROCESSING_FAILED': 'Lỗi hệ thống', // 500

    // === Forgot password (POST /api/v1/auth/forgot-password) ===
    'INVALID_EMAIL_FORMAT': 'Email không hợp lệ', // 400
    // USER_NOT_FOUND (404) đã được định nghĩa ở trên
    'SENDING_EMAIL_FAILED': 'Lỗi hệ thống', // 500

    // === Reset password (POST /api/v1/auth/reset-password) ===
    'RESET_TOKEN_INVALID_OR_EXPIRED': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', // 401
    'RESET_PASSWORD_FAILED': 'Lỗi hệ thống', // 500

    // === Logout (POST /api/v1/auth/logout) ===
    'INVALID_LOGOUT_REQUEST': 'Yêu cầu không hợp lệ', // 400
    'NO_VALID_AUTHENTICATION_FOUND': 'Người dùng chưa đăng nhập', // 401
    'LOGOUT_PROCESSING_FAILED': 'Lỗi hệ thống', // 500

    // === Lỗi chung ===
    'DEFAULT_ERROR': 'Lỗi hệ thống.'
};

export const HTTP_STATUS_ERROR_MESSAGES: { [key: number]: string } = {
    400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
    401: 'Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn.',
    402: 'Tài khoản chưa được xác thực. Vui lòng hoàn tất xác thực.',
    404: 'Không tìm thấy tài nguyên.',
    409: 'Xung đột dữ liệu. Có thể email đã tồn tại.',
    500: 'Lỗi máy chủ. Vui lòng thử lại sau.'
};

export const DEFAULT_ERROR_MESSAGE = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';

export function getErrorMessage(err: any): string {
    if (err && err.errorCode && AUTH_ERROR_MESSAGES[err.errorCode]) {
        return AUTH_ERROR_MESSAGES[err.errorCode];
    }
    if (err && err.httpStatus && HTTP_STATUS_ERROR_MESSAGES[err.httpStatus]) {
        return HTTP_STATUS_ERROR_MESSAGES[err.httpStatus];
    }
    return DEFAULT_ERROR_MESSAGE;
}