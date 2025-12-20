import apiService from "../apiService";

export interface SenderResponse {
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
}

export interface MessageDTO {
  id: string;
  chatRoomId: string;
  sender: SenderResponse;
  messageType: "TEXT" | "IMAGE" | "FILE";
  textContent: string;
  metadata: string | null; // URL for file/image/video
  parentMessageId: string | null;
  createdAt: string;
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
  textContent: string;
  parentMessageId?: string;
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
  sendMessage: (roomId: string, data: SendMessageRequest) =>
    apiService.post<ApiResponse<MessageDTO>>(`/messages/send/${roomId}`, data),

  getChatHistory: (roomId: string, cursor?: string, limit: number = 20) => {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    params.append("limit", limit.toString());
    return apiService.get<
      ApiResponse<{
        data: MessageDTO[];
        pagination: {
          nextCursor: string | null;
          hasNext: boolean;
        };
      }>
    >(`/messages/room/${roomId}?${params.toString()}`);
  },
};
