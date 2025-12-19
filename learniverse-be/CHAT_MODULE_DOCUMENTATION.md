# Learniverse Chat Module - Complete Documentation

## Overview

The Learniverse Chat Module is a comprehensive real-time messaging system built with Spring Boot, WebSocket (STOMP), and PostgreSQL. It supports direct messaging, group chats, message receipts, typing indicators, and online/offline status tracking.

---

## Features Implemented

### ✅ 1. Chat Rooms

- **Direct/Private Chat**: 1-to-1 messaging between two users
- **Group Chat**: Multi-user chat rooms with customizable names
- **Participants Management**: Add/remove participants, leave chat

### ✅ 2. Messaging

- **Send Messages**: Text messages with timestamps
- **Message Types**: TEXT (extensible for IMAGE, FILE, etc.)
- **Message History**: Retrieve paginated chat history
- **Real-time Delivery**: WebSocket-based instant message delivery

### ✅ 3. Message Receipts

- **Delivery Status**: Track when messages are delivered
- **Read Status**: Track when messages are read
- **Unread Count**: Get count of unread messages per chat room
- **Bulk Operations**: Mark multiple messages as read at once
- **Status Flow**: SENT → DELIVERED → READ

### ✅ 4. Typing Indicators

- **Real-time Typing**: Broadcast when users are typing
- **Per Chat Room**: Typing indicators scoped to specific chats
- **WebSocket Events**: Live updates via `/topic/typing/{chatRoomId}`

### ✅ 5. Online/Offline Status

- **User Presence**: Track online/offline status
- **Last Seen**: Track when user was last active
- **Real-time Updates**: Broadcast status changes via WebSocket
- **Connection Tracking**: Automatic status updates on connect/disconnect

### ✅ 6. Real-time Updates (WebSocket)

- **Message Delivery**: `/topic/chat/{chatRoomId}`
- **Typing Indicators**: `/topic/typing/{chatRoomId}`
- **Read Receipts**: `/topic/receipts/{messageId}`
- **User Status**: `/topic/status/{userId}`

---

## Architecture

### Backend Stack

- **Framework**: Spring Boot 3.5.6
- **Language**: Java 17
- **Database**: PostgreSQL
- **WebSocket**: STOMP over SockJS
- **Authentication**: JWT Bearer Token
- **API Documentation**: Swagger/OpenAPI

### Database Schema

```sql
-- Chat Rooms
chat_rooms (
  id UUID PRIMARY KEY,
  name VARCHAR,
  is_group_chat BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- Chat Participants
chat_participants (
  id UUID PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP,
  left_at TIMESTAMP
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id),
  sender_id UUID REFERENCES users(id),
  message_type VARCHAR,
  text_content TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- Message Receipts
message_receipts (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR, -- SENT, DELIVERED, READ
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## REST API Endpoints

### Base URL: `http://localhost:8080/api/v1`

### Chat Rooms

| Method | Endpoint                                | Description                         |
| ------ | --------------------------------------- | ----------------------------------- |
| GET    | `/chats`                                | Get all chat rooms for current user |
| GET    | `/chats/{id}`                           | Get specific chat room details      |
| GET    | `/chats/direct`                         | Get all direct chats                |
| POST   | `/chats/direct/{recipientId}`           | Create direct chat with user        |
| POST   | `/chats/group`                          | Create group chat                   |
| GET    | `/chats/group`                          | Get all group chats                 |
| GET    | `/chats/{roomId}/participants`          | Get chat participants               |
| POST   | `/chats/{roomId}/add`                   | Add participant to chat             |
| DELETE | `/chats/{roomId}/participants/{userId}` | Remove participant                  |
| POST   | `/chats/{id}/leave`                     | Leave chat room                     |

### Messages

| Method | Endpoint                         | Description                  |
| ------ | -------------------------------- | ---------------------------- |
| POST   | `/messages/send`                 | Send a message               |
| GET    | `/chats/rooms/{roomId}/messages` | Get chat history (paginated) |

### Message Receipts

| Method | Endpoint                                             | Description                    |
| ------ | ---------------------------------------------------- | ------------------------------ |
| POST   | `/messages/receipts/read/{messageId}`                | Mark message as read           |
| POST   | `/messages/receipts/read/multiple`                   | Mark multiple messages as read |
| POST   | `/messages/receipts/read-all?chatRoomId={id}`        | Mark all messages as read      |
| GET    | `/messages/receipts/{messageId}`                     | Get all receipts for message   |
| GET    | `/messages/receipts/unread/count?chatRoomId={id}`    | Get unread count               |
| GET    | `/messages/receipts/unread/messages?chatRoomId={id}` | Get unread message IDs         |

---

## WebSocket Integration

### Connection

```javascript
const socket = new SockJS("http://localhost:8080/ws");
const stompClient = Stomp.over(socket);

stompClient.connect(
  {
    Authorization: "Bearer " + token,
  },
  (frame) => {
    console.log("Connected: " + frame);
  }
);
```

### Subscribe to Chat Messages

```javascript
stompClient.subscribe("/topic/chat/" + chatRoomId, (message) => {
  const msg = JSON.parse(message.body);
  displayMessage(msg);
});
```

### Send Message

```javascript
stompClient.send(
  "/app/chat.sendMessage",
  {},
  JSON.stringify({
    chatRoomId: chatRoomId,
    messageType: "TEXT",
    textContent: "Hello!",
  })
);
```

### Typing Indicator

```javascript
// Subscribe to typing events
stompClient.subscribe("/topic/typing/" + chatRoomId, (event) => {
  const data = JSON.parse(event.body);
  showTypingIndicator(data.userId, data.username, data.isTyping);
});

// Send typing event
stompClient.send(
  "/app/chat.typing",
  {},
  JSON.stringify({
    chatRoomId: chatRoomId,
    isTyping: true,
  })
);
```

### Read Receipts

```javascript
// Subscribe to receipt updates
stompClient.subscribe("/topic/receipts/" + messageId, (receipt) => {
  const data = JSON.parse(receipt.body);
  updateReadStatus(data.messageId, data.userId, data.readAt);
});

// Send read receipt
stompClient.send(
  "/app/chat.receipt",
  {},
  JSON.stringify({
    messageId: messageId,
    userId: userId,
  })
);
```

### Online/Offline Status

```javascript
// Subscribe to user status
stompClient.subscribe("/topic/status/" + userId, (status) => {
  const data = JSON.parse(status.body);
  updateUserStatus(data.userId, data.online, data.lastSeen);
});
```

---

## API Request/Response Examples

### 1. Create Direct Chat

```bash
POST /api/v1/chats/direct/{recipientId}
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "message": "Direct chat room created successfully",
  "data": {
    "id": "uuid",
    "name": null,
    "participants": ["user1_id", "user2_id"],
    "groupChat": false,
    "createdAt": "2025-12-19T15:00:00"
  }
}
```

### 2. Send Message

```bash
POST /api/v1/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "chatRoomId": "uuid",
  "messageType": "TEXT",
  "textContent": "Hello!"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "chatRoomId": "uuid",
    "senderId": "uuid",
    "senderUsername": "John Doe",
    "messageType": "TEXT",
    "textContent": "Hello!",
    "createdAt": "2025-12-19T15:00:00"
  }
}
```

### 3. Get Unread Count

```bash
GET /api/v1/messages/receipts/unread/count?chatRoomId={id}
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 5
  }
}
```

### 4. Mark as Read

```bash
POST /api/v1/messages/receipts/read/{messageId}
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "success",
  "message": "Message marked as read",
  "data": {
    "messageId": "uuid",
    "userId": "uuid",
    "username": "John Doe",
    "deliveredAt": "2025-12-19T15:00:00",
    "readAt": "2025-12-19T15:01:00",
    "isRead": true
  }
}
```

---

## Testing

### Automated Test Script

```bash
./test_message_receipts_complete.sh
```

**Test Coverage:**

- ✅ User authentication (multiple users)
- ✅ Direct chat creation
- ✅ Group chat creation
- ✅ Message sending
- ✅ Message retrieval (pagination)
- ✅ Unread count tracking
- ✅ Mark as read (single & bulk)
- ✅ Receipt retrieval
- ✅ Typing indicators
- ✅ Online/offline status

### Manual Testing

#### 1. Login

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

#### 2. Create Chat

```bash
TOKEN="your_jwt_token"
USER2_ID="recipient_user_id"

curl -X POST "http://localhost:8080/api/v1/chats/direct/${USER2_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

#### 3. Send Message

```bash
CHAT_ID="chat_room_id"

curl -X POST "http://localhost:8080/api/v1/messages/send" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "chatRoomId": "'${CHAT_ID}'",
    "messageType": "TEXT",
    "textContent": "Hello!"
  }'
```

#### 4. Check Unread Count

```bash
curl -X GET "http://localhost:8080/api/v1/messages/receipts/unread/count?chatRoomId=${CHAT_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Key Components

### Models

- `ChatRoom.java` - Chat room entity
- `ChatParticipant.java` - Participant mapping
- `Message.java` - Message entity
- `MessageReceipt.java` - Receipt tracking entity

### Repositories

- `ChatRoomRepository.java` - Chat room data access
- `ChatParticipantRepository.java` - Participant data access
- `MessageRepository.java` - Message data access
- `MessageReceiptRepository.java` - Receipt data access

### Services

- `IChatRoomService.java` / `ChatRoomServiceImpl.java` - Chat room logic
- `IMessageService.java` / `MessageServiceImpl.java` - Message logic
- `IMessageReceiptService.java` / `MessageReceiptServiceImpl.java` - Receipt logic
- `IChatParticipantService.java` / `ChatParticipantServiceImpl.java` - Participant logic

### Controllers

- `ChatRoomController.java` - Chat room REST endpoints
- `MessageController.java` - Message REST endpoints
- `MessageReceiptController.java` - Receipt REST endpoints
- `WebSocketChatController.java` - WebSocket message handlers

### DTOs

- Request: `SendMessageRequest.java`, `CreateGroupChatRequest.java`, `MarkMessageReadRequest.java`
- Response: `MessageDTO.java`, `ChatRoomDTO.java`, `MessageReceiptDTO.java`

### Configuration

- `SecurityConfig.java` - JWT authentication & authorization
- `WebSocketConfig.java` - WebSocket/STOMP configuration
- `WebConfig.java` - CORS configuration

---

## Security

### Authentication

- **Method**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Required**: All chat endpoints require authentication

### Authorization

- Users can only access chats they are participants in
- Only chat participants can send messages
- Only chat participants can view message history
- Users can only mark their own messages as read

### Data Privacy

- Message content encrypted in transit (HTTPS/WSS)
- Users only see their own read receipts
- Soft delete for messages and chats
- Participant verification on all operations

---

## Error Handling

### Common Errors

**401 Unauthorized**

```json
{
  "status": "error",
  "message": "You are not a participant of this chat room",
  "errorCode": "UNAUTHORIZED"
}
```

**404 Not Found**

```json
{
  "status": "error",
  "message": "Chat room not found with id: {id}",
  "errorCode": "RESOURCE_NOT_FOUND"
}
```

**400 Bad Request**

```json
{
  "status": "error",
  "message": "Cannot create group chat with less than 2 participants",
  "errorCode": "BAD_REQUEST"
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Pagination**: Messages retrieved in pages (default 20 per page)
2. **Indexing**: Database indexes on foreign keys and timestamps
3. **Caching**: Consider Redis for unread counts and online status
4. **WebSocket**: Reduces HTTP overhead for real-time features
5. **Batch Operations**: Bulk mark-as-read for efficiency
6. **Soft Delete**: Preserves data integrity without hard deletes

### Scalability

- Stateless REST API (horizontal scaling)
- WebSocket connection pooling
- Database connection pooling (HikariCP)
- Async message processing (future enhancement)
- Message queue for offline delivery (future enhancement)

---

## Future Enhancements

### Phase 1 (Completed) ✅

- Direct and group chat
- Message sending/receiving
- Message receipts (delivery & read)
- Typing indicators
- Online/offline status
- WebSocket real-time updates

### Phase 2 (Planned)

- [ ] File attachments (images, documents)
- [ ] Voice messages
- [ ] Message reactions (emoji)
- [ ] Message editing
- [ ] Message deletion (both sides)
- [ ] Forward messages
- [ ] Reply to specific messages
- [ ] Search messages

### Phase 3 (Future)

- [ ] Video/audio calls (WebRTC)
- [ ] Screen sharing
- [ ] Message encryption (end-to-end)
- [ ] Chat backup/export
- [ ] Pinned messages
- [ ] Mute/unmute chats
- [ ] Block users
- [ ] Report abuse

---

## Troubleshooting

### WebSocket Connection Failed

- Check if backend is running on port 8080
- Verify CORS configuration allows your frontend origin
- Ensure JWT token is valid and not expired

### Messages Not Delivering

- Verify user is a participant in the chat room
- Check WebSocket connection is established
- Ensure chat room ID is correct

### Unread Count Not Updating

- Check receipt status is being updated to READ
- Verify user ID matches the logged-in user
- Ensure chat room ID is correct

### "No static resource" Error

- This occurs when message ID is empty/invalid
- Verify message exists before marking as read
- Check API endpoint path is correct

---

## API Documentation

Interactive API documentation available at:

```
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON specification:

```
http://localhost:8080/v3/api-docs
```

---

## Test Credentials

**User 1:**

- Email: `heyiamthinh1003@gmail.com`
- Password: `123456A@`

**User 2:**

- Email: `abc@gmail.com`
- Password: `123456A@`

---

## Quick Start

1. **Start the application**

```bash
./gradlew bootRun
```

2. **Run tests**

```bash
./test_message_receipts_complete.sh
```

3. **Access Swagger UI**

```
http://localhost:8080/swagger-ui.html
```

4. **Test WebSocket connection**
   - Use browser console or Postman
   - Connect to `ws://localhost:8080/ws`
   - Send STOMP CONNECT with Authorization header

---

**Last Updated**: December 19, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
