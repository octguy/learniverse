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
  senderAvatar: string | null;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  textContent: string;
  metadata: string | null;
  createdAt: string;
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
  messageCursors: Record<string, string | null>; // Track next cursor for each chat
  hasMoreMessages: Record<string, boolean>; // Track if more messages available
  loadingMore: Record<string, boolean>; // Track loading state for infinite scroll
  currentUserId: string | null; // Track current user ID for "You:" prefix
};

export type Action =
  | { type: "SELECT_CHAT"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SEND_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SET_USER_ID"; payload: string }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | {
      type: "SET_MESSAGES_WITH_CURSOR";
      payload: {
        chatId: string;
        messages: Message[];
        nextCursor: string | null;
        hasNext: boolean;
      };
    }
  | {
      type: "PREPEND_MESSAGES";
      payload: {
        chatId: string;
        messages: Message[];
        nextCursor: string | null;
        hasNext: boolean;
      };
    }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_CHAT_UNREAD"; payload: { chatId: string; count: number } }
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "SET_LOADING_MORE";
      payload: { chatId: string; loading: boolean };
    };
