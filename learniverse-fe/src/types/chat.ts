export type User = {
  id: string;
  displayName: string;
  avatar: string;
};

export type Message = {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  textContent: string;
  createdAt: string;
  updatedAt?: string;
};

export type Chat = {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: string | null;
  unreadCount: number;
  participants: string[];
  isGroupChat: boolean;
};

export type AppState = {
  chats: Chat[];
  messages: Record<string, Message[]>;
  currentChatId: string | null;
  searchQuery: string;
  loading: boolean;
};

export type Action =
  | { type: "SELECT_CHAT"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SEND_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_CHAT_UNREAD"; payload: { chatId: string; count: number } }
  | { type: "SET_LOADING"; payload: boolean };
