# WebSocket 401 Error - Backend Fix Required

## Problem

The WebSocket connection is failing with a **401 Unauthorized** error because the Spring Security configuration is blocking access to the `/ws` endpoint (used for SockJS/WebSocket connections).

### Error Log

```
GET http://localhost:8080/ws/info?t=1766133894722 401 (Unauthorized)
```

## Root Cause

In `SecurityConfig.java`, the `/ws` endpoint is **not included** in the `permitAll()` list. This means Spring Security is requiring authentication for the initial SockJS handshake, which happens **before** the STOMP connection can send the JWT token.

## Required Backend Fix

In the file:

```
learniverse-be/src/main/java/org/example/learniversebe/config/SecurityConfig.java
```

Add the `/ws/**` endpoint to the permitAll list:

### Current Code (around line 65-77):

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/swagger-ui/**",
                "/swagger-ui.html",
                "/v3/api-docs/**",
                "/v3/api-docs.yaml",
                "/swagger-resources/**",
                "/webjars/**").permitAll()
        .requestMatchers("/api/v1/auth/logout").authenticated()
        .requestMatchers("/api/v1/auth/**").permitAll()
```

### Fixed Code:

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/swagger-ui/**",
                "/swagger-ui.html",
                "/v3/api-docs/**",
                "/v3/api-docs.yaml",
                "/swagger-resources/**",
                "/webjars/**",
                "/ws/**").permitAll()  // ADD THIS LINE - Allow WebSocket endpoint
        .requestMatchers("/api/v1/auth/logout").authenticated()
        .requestMatchers("/api/v1/auth/**").permitAll()
```

## Why This Works

1. **SockJS Handshake**: When a client connects via SockJS, it first makes a GET request to `/ws/info` to get server information. This happens **before** the STOMP connection.

2. **STOMP Authentication**: After the SockJS connection is established, the STOMP CONNECT frame is sent with the JWT token in the `Authorization` header.

3. **WebSocketAuthInterceptor**: The existing `WebSocketAuthInterceptor` already handles authentication at the STOMP level by validating the JWT token from the CONNECT frame headers.

By allowing unauthenticated access to `/ws/**` for the initial handshake, authenticated users can then connect via STOMP with their JWT token, which is validated by `WebSocketAuthInterceptor`.

## Security Note

This is **secure** because:

- The `/ws/**` endpoint only allows the SockJS handshake (getting server info and establishing connection)
- Actual message sending/receiving requires STOMP authentication via `WebSocketAuthInterceptor`
- The JWT token is validated on every STOMP CONNECT command
- Users without valid tokens cannot send or receive messages

## Alternative Solutions (Not Recommended)

### Option 1: Custom WebSocket Security (Complex)

Create a custom `WebSocketSecurityConfig` that handles authentication differently. This is more complex and not necessary.

### Option 2: Pass Token in URL Query Parameter

Modify the backend to accept tokens as query parameters in the WebSocket URL. This is **less secure** as tokens could be logged in server logs and browser history.

## Recommended Solution

**Simply add `/ws/**` to permitAll\*\* in SecurityConfig.java - this is the standard approach for WebSocket endpoints with STOMP authentication.

## Testing After Fix

1. Restart the backend server
2. The frontend should automatically connect without errors
3. Check browser console for: `[WebSocket] Connected`
4. Messages should send and receive in real-time

## Additional Note

The 500 error for the messages endpoint is a separate backend issue that should also be investigated:

```
GET http://localhost:8080/api/v1/chats/rooms/{roomId}/messages 500 (Internal Server Error)
```

This might be related to database queries or message history retrieval. Check backend logs for more details.
