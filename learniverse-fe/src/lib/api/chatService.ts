import apiService from "../apiService";

export interface MessageReceiptDTO {
  id: string;
  messageId: string;
  userId: string;
  username: string;
  status: "SENT" | "DELIVERED" | "READ";
  deliveredAt: string | null;
  readAt: string | null;
  isRead: boolean;
}

export interface MessageDTO {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string; // API uses senderName
  senderUsername?: string; // Optional for backward compatibility
  senderAvatar: string | null;
  messageType: "TEXT" | "IMAGE" | "FILE";
  textContent: string;
  sendAt: string; // API uses sendAt for creation time
  createdAt?: string; // Optional for backward compatibility
  updatedAt: string;
  edited: boolean;
  metadata: any | null;
  parentMessageId: string | null;
}

export interface ChatRoomDTO {
  id: string;
  name: string | null;
  participants: string[];
  groupChat: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage: MessageDTO | null;
  unreadCount: number;
}

export interface ParticipantDTO {
  userId: string;
  username: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface SendMessageRequest {
  chatRoomId: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  textContent: string;
}

export interface CreateGroupChatRequest {
  name: string;
  participantIds: string[];
}

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

export const chatService = {
  // Chat Rooms
  getAllChats: () => apiService.get<ApiResponse<ChatRoomDTO[]>>("/chats"),

  getChatById: (chatId: string) =>
    apiService.get<ApiResponse<ChatRoomDTO>>(`/chats/${chatId}`),

  getDirectChats: () =>
    apiService.get<ApiResponse<ChatRoomDTO[]>>("/chats/direct"),

  createDirectChat: (recipientId: string) =>
    apiService.post<ApiResponse<ChatRoomDTO>>(`/chats/direct/${recipientId}`),

  createGroupChat: (data: CreateGroupChatRequest) =>
    apiService.post<ApiResponse<ChatRoomDTO>>("/chats/group", data),

  getGroupChats: () =>
    apiService.get<ApiResponse<ChatRoomDTO[]>>("/chats/group"),

  getChatParticipants: (roomId: string) =>
    apiService.get<ApiResponse<ParticipantDTO[]>>(
      `/chats/${roomId}/participants`
    ),

  addParticipant: (roomId: string, userId: string) =>
    apiService.post<ApiResponse<void>>(`/chats/${roomId}/add`, { userId }),

  removeParticipant: (roomId: string, userId: string) =>
    apiService.delete<ApiResponse<void>>(
      `/chats/${roomId}/participants/${userId}`
    ),

  leaveChat: (chatId: string) =>
    apiService.post<ApiResponse<void>>(`/chats/${chatId}/leave`),

  // Messages
  sendMessage: (data: SendMessageRequest) =>
    apiService.post<ApiResponse<MessageDTO>>("/messages/send", data),

  getChatHistory: (roomId: string, page: number = 0, size: number = 50) =>
    apiService.get<
      ApiResponse<{
        messages: MessageDTO[];
        currentPage: number;
        totalPages: number;
        totalElements: number;
        hasNext: boolean;
        hasPrevious: boolean;
      }>
    >(`/chats/rooms/${roomId}/messages?page=${page}&size=${size}`),

  // Message Receipts
  markMessageAsRead: (messageId: string) =>
    apiService.post<ApiResponse<MessageReceiptDTO>>(
      `/messages/receipts/read/${messageId}`
    ),

  markMultipleAsRead: (messageIds: string[]) =>
    apiService.post<ApiResponse<MessageReceiptDTO[]>>(
      "/messages/receipts/read/multiple",
      { messageIds }
    ),

  markAllAsRead: (chatRoomId: string) =>
    apiService.post<ApiResponse<void>>(
      `/messages/receipts/read-all?chatRoomId=${chatRoomId}`
    ),

  getMessageReceipts: (messageId: string) =>
    apiService.get<ApiResponse<MessageReceiptDTO[]>>(
      `/messages/receipts/${messageId}`
    ),

  getUnreadCount: (chatRoomId: string) =>
    apiService.get<ApiResponse<{ unreadCount: number }>>(
      `/messages/receipts/unread/count?chatRoomId=${chatRoomId}`
    ),

  getUnreadMessages: (chatRoomId: string) =>
    apiService.get<ApiResponse<string[]>>(
      `/messages/receipts/unread/messages?chatRoomId=${chatRoomId}`
    ),
};
