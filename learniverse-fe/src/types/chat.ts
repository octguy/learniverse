export type User = {
  id: string;
  displayName: string;
  avatar: string;
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
};

export type Chat = {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: { content: string; createdAt: string };
  unreadCount: number;
};

export type AppState = {
  chats: Chat[];
  messages: Record<string, Message[]>;
  currentChatId: string | null;
  searchQuery: string;
};

export type Action =
  | { type: 'SELECT_CHAT'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SEND_MESSAGE'; payload: { chatId: string; message: Message } };
