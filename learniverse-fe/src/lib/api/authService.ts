const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
console.log("API_URL = ", API_URL);
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { ...data, httpStatus: response.status };
  }
  return data;
}

export const authService = {
  async register(payload: {
    email: string;
    password: string;
    username: string;
  }) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<AuthResponse>>(res);
  },

  async login(payload: {
    email: string;
    password: string;
  }) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async verifyUser(payload: {
    email: string;
    verificationCode: string;
  }) {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<string>>(res);
  },

  async resendVerificationCode(email: string) {
    const res = await fetch(`${API_URL}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
      method: "POST",
    });
    return handleResponse<ApiResponse<string>>(res);
  },

  async refreshToken(payload: {
    refreshToken: string;
  }) {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<AuthResponse>>(res);
  },

  async forgotPassword(payload: {
    email: string;
  }) {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<string>>(res);
  },

  async resetPassword(payload: {
    token: string;
    newPassword: string;
  }) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiResponse<string>>(res);
  },

  async logout() {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
    });
    return handleResponse<ApiResponse<string>>(res);
  },
};

export interface ApiResponse<T> {
  status: string | number;
  message: string;
  result: T;
  errors: unknown;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

