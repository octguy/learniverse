// TypeScript types matching backend ChatSocketEvent structure

export enum SocketEventType {
  NEW_MESSAGE = "NEW_MESSAGE",
  MESSAGE_RECEIPT = "MESSAGE_RECEIPT",
  USER_TYPING = "USER_TYPING",
  USER_ONLINE = "USER_ONLINE",
  USER_OFFLINE = "USER_OFFLINE",
}

export interface ChatSocketEvent<T = any> {
  eventType: SocketEventType;
  data: T;
}

// Specific event data types
export interface MessageEventData {
  id: string;
  chatRoomId: string;
  sender: {
    senderId: string;
    senderName: string;
    senderAvatar: string | null;
  };
  messageType: string;
  textContent: string;
  metadata?: string;
  parentMessageId?: string;
  createdAt: string;
}

export interface TypingEventData {
  userId: string;
  username: string;
  chatRoomId: string;
  isTyping: boolean;
}

export interface ReceiptEventData {
  messageId: string;
  userId: string;
  username: string;
  readAt: string;
}

export interface UserStatusEventData {
  userId: string;
  online: boolean;
  lastSeen: string;
}
