# Chat Module - Frontend Integration

This document describes the frontend implementation for the chat module that integrates with the Learniverse backend chat API.

## Features Implemented

### ✅ Real-time Messaging

- Send and receive messages in real-time via WebSocket
- Display message history with pagination support
- Support for TEXT message types (extensible for IMAGE, FILE)
- Auto-scroll to latest messages
- Display sender names and timestamps

### ✅ Chat List

- Display all user's chat rooms (direct and group chats)
- Show unread message counts
- Display last message preview
- Search functionality for chats
- Sort chats by last message time

### ✅ WebSocket Integration

- Automatic connection with JWT authentication
- Subscribe to chat room messages
- Real-time message delivery
- Auto-reconnection on disconnect
- Support for typing indicators (ready to use)
- Support for read receipts (ready to use)

### ✅ Message Management

- Load chat history when selecting a chat
- Mark messages as read automatically
- Update unread counts
- Optimistic UI updates

## Architecture

### Services

#### 1. Chat Service (`/src/lib/api/chatService.ts`)

HTTP API service for:

- Fetching chat rooms
- Creating direct and group chats
- Sending messages
- Managing participants
- Message receipts and read status

#### 2. WebSocket Service (`/src/lib/websocketService.ts`)

Real-time communication service for:

- WebSocket connection management
- Subscribing to chat topics
- Sending real-time events
- Handling reconnection

### Components

#### 1. ChatPage (`/src/app/(main)/chat/page.tsx`)

Main chat page that:

- Loads all chats on mount
- Connects to WebSocket
- Manages chat state with reducer
- Handles chat selection and message sending

#### 2. ChatWindow (`/src/components/chat/ChatWindow.tsx`)

Message display and input:

- Shows message history
- Grouped by date
- Sender identification
- Message input form

#### 3. ChatList (`/src/components/chat/ChatList.tsx`)

Chat room list:

- Displays all chats
- Shows unread counts
- Highlights selected chat

#### 4. ChatListItem (`/src/components/chat/ChatListItem.tsx`)

Individual chat item:

- Avatar display
- Last message preview
- Unread badge
- Time ago formatting

### State Management

Uses React's `useReducer` with actions:

- `SELECT_CHAT`: Select a chat room
- `SET_CHATS`: Set all chat rooms
- `SET_MESSAGES`: Set messages for a chat
- `ADD_MESSAGE`: Add a new message (real-time or sent)
- `SEND_MESSAGE`: Send a message
- `UPDATE_CHAT_UNREAD`: Update unread count
- `SET_SEARCH_QUERY`: Filter chats
- `SET_LOADING`: Show loading state

## API Endpoints Used

### Chat Rooms

- `GET /chats` - Get all chat rooms
- `GET /chats/{id}` - Get specific chat
- `POST /chats/direct/{recipientId}` - Create direct chat
- `POST /chats/group` - Create group chat
- `GET /chats/{roomId}/participants` - Get participants

### Messages

- `POST /messages/send` - Send message
- `GET /chats/rooms/{roomId}/messages` - Get message history

### Receipts

- `POST /messages/receipts/read/{messageId}` - Mark as read
- `POST /messages/receipts/read-all` - Mark all as read
- `GET /messages/receipts/unread/count` - Get unread count

## WebSocket Topics

### Subscribe to:

- `/topic/chat/{chatRoomId}` - New messages
- `/topic/typing/{chatRoomId}` - Typing indicators
- `/topic/receipts/{messageId}` - Read receipts
- `/topic/status/{userId}` - User online/offline status

### Publish to:

- `/app/chat.sendMessage` - Send message
- `/app/chat.typing` - Typing indicator
- `/app/chat.receipt` - Read receipt

## Setup Instructions

### 1. Environment Variables

Create `.env.local` in the frontend root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

### 2. Install Dependencies

```bash
npm install
```

Required packages (already installed):

- `@stomp/stompjs` - STOMP WebSocket client
- `sockjs-client` - SockJS client
- `axios` - HTTP client
- `date-fns` - Date formatting

### 3. Start the Application

```bash
npm run dev
```

The chat will be available at `http://localhost:8386/chat`

## Usage Flow

### 1. Initial Load

1. User opens chat page
2. App fetches all chat rooms from API
3. App connects to WebSocket with JWT token
4. Displays chat list with unread counts

### 2. Selecting a Chat

1. User clicks on a chat
2. App loads message history via API
3. App subscribes to WebSocket topic for that chat
4. App marks all messages as read
5. Updates unread count to 0

### 3. Sending a Message

1. User types and sends message
2. App calls API to send message
3. API responds with message details
4. Message is added to local state
5. WebSocket broadcasts to all participants

### 4. Receiving a Message

1. WebSocket receives message event
2. App checks if message is for current chat
3. Adds message to state
4. Auto-scrolls to bottom
5. Marks as read if in current chat

## Type Definitions

### Message

```typescript
type Message = {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  textContent: string;
  createdAt: string;
  updatedAt?: string;
};
```

### Chat

```typescript
type Chat = {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: { content: string; createdAt: string } | null;
  unreadCount: number;
  participants: string[];
  isGroupChat: boolean;
};
```

## Authentication

The app expects these items in `sessionStorage`:

- `accessToken` - JWT token for API calls
- `refreshToken` - For token refresh
- `userId` - Current user's ID

These are set during login and used for:

- API authorization headers
- WebSocket connection headers
- Message sender identification

## Error Handling

- API errors show toast notifications
- WebSocket disconnections trigger auto-reconnect
- Failed messages can be retried
- Loading states prevent duplicate requests

## Future Enhancements

Ready to implement:

- Typing indicators display
- Read receipts display (who read the message)
- Online/offline status indicators
- Message reactions
- Image and file uploads
- Message editing/deletion
- Group chat management UI
- User profiles in chat
- Message search
- Push notifications

## Testing

### Manual Testing Checklist

- [ ] Load chat list successfully
- [ ] Select a chat and load messages
- [ ] Send a message
- [ ] Receive a message in real-time
- [ ] Search for chats
- [ ] Unread count updates correctly
- [ ] Mark messages as read
- [ ] WebSocket reconnects on disconnect
- [ ] Multiple tabs/windows sync

### API Testing

Use the Postman collection in `learniverse-be/guide/Learniverse_Chat_Postman_Collection.json` to test backend endpoints.

## Troubleshooting

### WebSocket Not Connecting

1. Check if backend is running
2. Verify `NEXT_PUBLIC_WS_URL` in `.env.local`
3. Check browser console for errors
4. Verify JWT token is valid

### Messages Not Loading

1. Check API endpoint configuration
2. Verify authentication token
3. Check browser network tab for API errors
4. Review backend logs

### Real-time Updates Not Working

1. Ensure WebSocket is connected (check console)
2. Verify subscription to correct topic
3. Check if message format matches backend
4. Review WebSocket debug logs

## Notes

- The chat UI is optimized for desktop/tablet views
- Mobile responsive design is partially implemented
- Vietnamese language is used for UI text
- Date formatting uses `date-fns` with locale support
- Avatar fallbacks show first letter of chat name
