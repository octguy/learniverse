# Learniverse — Authentication Guide

### Purpose

- Describe the authentication endpoints, expected payloads and responses, recommended token handling, and example requests so frontend engineers can integrate quickly.

### Base path

- All endpoints are under: `/api/v1/auth`

### Endpoints

#### 1. Register

- **POST** /api/v1/auth/register
- **Body request** (JSON):

```json
{
  "email": "user1@example.com",
  "username": "User1",
  "password": "P@ssw0rd"
}
```

- **Cases:**

| Status code                  | Message to debug                | Message to display (not mandatory)                                                                |
| ---------------------------- |---------------------------------|---------------------------------------------------------------------------------------------------|
| 201 Created ✅               | User registered successfully    | Đăng ký thành công.                                                                               |
| 400 Bad Request 🚫           |                                 | Thông tin đăng ký không hợp lệ                                                                    |
| 409 Conflict 🚫              | Username / Email already in use | Email hoặc username đã tồn tại. Vui lòng dùng thông tin khác. **(not recommended in production)** |
| 500 Internal Server Error ❌ | Role not found                  | Lỗi hệ thống.                                                                                     |

- **Notes:** After registration user may need to verify email using code.

#### 2. Login

- **POST** /api/v1/auth/login
- **Body request** (JSON):

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd"
}
```

- **Cases:**

| Status code                 | Message to debug            | Message to display (not mandatory) |
|-----------------------------|-----------------------------|------------------------------------|
| 200 OK ✅                    | User logged in successfully | Đăng nhập thành công               |
| 400 Bad Request 🚫          | Validation error            | Thông tin đăng nhập không hợp lệ   |
| 401 Unauthorized 🚫         | Bad credentials             | Email hoặc mật khẩu không đúng     |
| 403 Forbidden 🚫            | Unverified user             | Người dùng chưa xác thực           |
| 500 Internal Server Error ❌ |                             | Lỗi hệ thống                       |

#### 3. Verify user

- **POST** /api/v1/auth/verify
- **Body request** (JSON):

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

- **Cases:**

| Status code                  | Message to debug               | Message to display (not mandatory)       |
| ---------------------------- | ------------------------------ | ---------------------------------------- |
| 200 OK ✅                    | User verified successfully     | Xác thực tài khoản thành công            |
| 400 Bad Request 🚫           | Invalid or expired code        | Mã xác thực không hợp lệ hoặc đã hết hạn |
| 404 Not Found 🚫             | User not found                 | Người dùng không tồn tại                 |
| 500 Internal Server Error ❌ | Verification processing failed | Lỗi hệ thống                             |

- **Notes:** Called after user enters verification code sent by email in the verification form. On success user can proceed to login.

#### 4. Resend verification code

- **POST** /api/v1/auth/resend-verification?email={email}
- **Query param**: email (string)

- **Cases:** Invalid email **(frontend will validate the email format to make sure the email is correct)**

| Status code                  | Message to debug                      | Message to display (not mandatory) |
| ---------------------------- | ------------------------------------- | ---------------------------------- |
| 200 OK ✅                    | Verification code resent successfully | Đã gửi lại mã xác thực             |
| 400 Bad Request 🚫           | User already verified                 | Tài khoản đã được xác thực         |
| 404 Not Found 🚫             | User not found                        | Người dùng không tồn tại           |
| 500 Internal Server Error ❌ | Resend processing failed              | Lỗi hệ thống                       |

- **Notes:** Use this when user didn't receive the original code.

#### 5. Refresh token

- **POST** /api/v1/auth/refresh-token
- **Body request** (JSON):

```json
{
  "refreshToken": "<refresh-token>"
}
```

- **Cases:**

| Status code                  | Message to debug                           | Message to display (not mandatory)                 |
| ---------------------------- | ------------------------------------------ | -------------------------------------------------- |
| 200 OK ✅                    | Token refreshed successfully               | Đã làm mới token                                   |
| 400 Bad Request 🚫           | Refresh token must not be blank            | Token không được để trống                          |
| 401 Unauthorized 🚫          | Refresh token invalid/not found or expired | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 500 Internal Server Error ❌ | Refresh processing failed                  | Lỗi hệ thống                                       |

- **Notes:** ApiResponse.data = AuthResponse. Prefer httpOnly cookie for refresh tokens; if refresh token is stored in cookie, sending the cookie may be sufficient.

#### 6. Forgot password

- **POST** /api/v1/auth/forgot-password
- **Body request** (JSON):

```json
{
  "email": "user@example.com"
}
```

- **Cases:**

| Status code                  | Message to debug                 | Message to display (not mandatory)      |
| ---------------------------- | -------------------------------- | --------------------------------------- |
| 200 OK ✅                    | Password reset link / token sent | Gửi yêu cầu đặt lại mật khẩu thành công |
| 400 Bad Request 🚫           | Invalid email format             | Email không hợp lệ                      |
| 404 Not Found 🚫             | User not found                   | Người dùng không tồn tại                |
| 500 Internal Server Error ❌ | Sending email failed             | Lỗi hệ thống                            |

- **Notes:** Backend will send reset link or token to email. Frontend should show generic success message to avoid user enumeration.

#### 7. Reset password

- **POST** /api/v1/auth/reset-password
- **Body request** (JSON):

```json
{
  "token": "<reset-token>",
  "newPassword": "NewP@ssw0rd"
}
```

- **Cases:**

| Status code                  | Message to debug                           | Message to display (not mandatory)                 |
| ---------------------------- | ------------------------------------------ | -------------------------------------------------- |
| 200 OK ✅                    | Token refreshed successfully               | Đã làm mới token                                   |
| 400 Bad Request 🚫           | Refresh token must not be blank            | Token không được để trống                          |
| 401 Unauthorized 🚫          | Refresh token invalid/not found or expired | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 500 Internal Server Error ❌ | Refresh processing failed                  | Lỗi hệ thống                                       |

- **Notes:** After successful reset, prompt user to log in with new password.

#### 8. Change password

- **POST** /api/v1/auth/change-password
- **Authentication**: Required — include access token in Authorization header: `Authorization: Bearer <access-token>`
- **Body request** (JSON):

```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ssw0rd"
}
```

- **Validation / password policy**:
  - New password must contain at least 1 number, 1 special character, and 1 uppercase letter (same regex enforced by backend).
  - Frontend should validate format before submitting and require the user to re-enter new password for confirmation if desired.

- **Cases:**

| Status code                  | Message to debug                             | Message to display (not mandatory)               |
| ---------------------------- | -------------------------------------------- |--------------------------------------------------|
| 200 OK ✅                    | Password changed successfully                 | Thay đổi mật khẩu thành công                     |
| 400 Bad Request 🚫           | Validation error (new password format)        | Mật khẩu mới không hợp lệ                        |
| 401 Unauthorized 🚫          | Current password is incorrect  | Mật khẩu hiện tại không đúng |
| 404 Not Found 🚫             | User not found                                | Người dùng không tồn tại                         |
| 500 Internal Server Error ❌ | Change password processing failed             | Lỗi hệ thống                                     |

- **Notes:**
  - Backend will verify the provided currentPassword before updating to the new password.
  - Use the access token (short-lived) in Authorization header; do not send refresh token here.
  - After a successful change, backend updates lastPasswordChange timestamp; frontend may force re-authentication or refresh tokens per security policy.
  - Show generic messages to users when appropriate to avoid leaking information.

#### 9. Logout

- **POST** /api/v1/auth/logout
- **Body request**: none (or may include device identifier)
- **Cases:**

| Status code                  | Message to debug              | Message to display (not mandatory) |
| ---------------------------- | ----------------------------- | ---------------------------------- |
| 200 OK ✅                    | User logged out successfully  | Đăng xuất thành công               |
| 400 Bad Request 🚫           | Invalid request               | Yêu cầu không hợp lệ               |
| 401 Unauthorized 🚫          | No valid authentication found | Người dùng chưa đăng nhập          |
| 500 Internal Server Error ❌ | Logout processing failed      | Lỗi hệ thống                       |

- **Notes:** Backend should invalidate refresh tokens or session. Frontend must clear stored tokens and redirect to login.

### Frontend token handling (recommended)

- Do NOT store refresh tokens in localStorage. Refresh tokens are long-lived and should be stored in a secure, httpOnly cookie (SameSite=strict/lax as appropriate) so they are not accessible to JavaScript and are protected from XSS.
- Store short-lived access tokens (JWT) in memory (e.g., React state, Redux store, or in-memory variable). If you must persist across tabs/sessions, prefer secure storage mechanisms and understand the tradeoffs.
- Auto-redirect to login-page when refresh token is expired or invalid:
  - If a refresh attempt returns 401/403 or the backend indicates the refresh token is expired, clear client auth state and redirect to the login page.
- Refresh flow when access (JWT) expires:
  - When an API call fails due to expired access token (401), call POST /api/v1/auth/refresh-token.
    - If refresh-token is valid: backend returns a new accessToken (and optionally a new refreshToken). Replace the access token in memory and retry the original request — this provides smooth UX.
    - If refresh-token is expired/invalid: redirect the user to the login page.
- Frontend should validate password formats according to the backend policy before submitting (regex for new password).

Example (concise) client-side flow using an HTTP interceptor (pseudocode):

```javascript
// Example: axios interceptor pseudocode
// Assumptions:
// - Access token stored in memory: auth.accessToken
// - Refresh token sent automatically via httpOnly cookie (no JS access)
// - /refresh-token accepts JSON { refreshToken: "<token>" } only if you store it elsewhere

import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

let isRefreshing = false;
let pendingRequests = [];

api.interceptors.request.use(config => {
  const token = auth.accessToken; // in-memory
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response && err.response.status === 401 && !original._retry) {
      // Access token likely expired
      original._retry = true;

      if (isRefreshing) {
        // queue the request until refresh finishes
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject, original });
        });
      }

      isRefreshing = true;
      try {
        // Try refreshing. If using httpOnly cookie for refresh token, backend will read cookie.
        // If refresh token must be sent in body, include it here (less recommended).
        const refreshResponse = await api.post('/auth/refresh-token', {/* optional body */});

        // Set new access token in memory
        auth.accessToken = refreshResponse.data.data.accessToken;

        // retry pending requests
        pendingRequests.forEach(p => p.resolve(api(p.original)));
        pendingRequests = [];

        // retry original
        return api(original);
      } catch (refreshError) {
        // Refresh failed (expired/invalid) -> force logout and redirect to login
        pendingRequests.forEach(p => p.reject(refreshError));
        pendingRequests = [];
        auth.clear(); // clear in-memory auth
        window.location.href = '/login'; // or use router navigation
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);
```

Notes:
- Prefer httpOnly cookies for refresh tokens; if your backend cannot use cookies, store refresh tokens in secure storage accessible only as needed and avoid localStorage.
- Avoid leaking details to users; show generic messages like "Session expired, please sign in again" when redirecting to login.
- Consider rotating refresh tokens (backend issues a new refresh token when refresh is used) to improve security.
