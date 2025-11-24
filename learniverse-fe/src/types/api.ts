export interface ApiResponse<T> {
    status: string | number;
    message: string;
    data: T;
    errors: unknown;
    errorCode?: string;
    httpStatus?: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
}

export interface AuthResponse {
    id: string;
    username: string;
    email: string;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface VerifyUserRequest {
    email: string;
    verificationCode: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
