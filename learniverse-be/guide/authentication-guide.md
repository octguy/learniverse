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

| Status code                  | Message to debug             | Message to display (not mandatory)                                              |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| 201 Created ✅               | User registered successfully | Đăng ký thành công.                                                             |
| 400 Bad Request 🚫           |                              | Thông tin đăng ký không hợp lệ                                                  |
| 409 Conflict 🚫              | Email already in use         | Email đã tồn tại. Vui lòng dùng email khác. **(not recommended in production)** |
| 500 Internal Server Error ❌ | Role not found               | Lỗi hệ thống.                                                                   |

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

| Status code                  | Message to debug                      | Message to display (not mandatory) |
| ---------------------------- | ------------------------------------- | ---------------------------------- |
| 200 OK ✅                    | User logged in successfully           | Đăng nhập thành công               |
| 400 Bad Request 🚫           | Validation error                      | Thông tin đăng nhập không hợp lệ   |
| 401 Unauthorized 🚫          | Invalid credentials / unverified user | Email hoặc mật khẩu không đúng     |
| 500 Internal Server Error ❌ |                                       | Lỗi hệ thống                       |

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

#### 8. Logout

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
