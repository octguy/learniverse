import type { AppState, Action } from "@/types/chat";

export function chatReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SELECT_CHAT": {
      const chatId = action.payload;

      const updatedChats = state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      );

      return {
        ...state,
        currentChatId: chatId,
        chats: updatedChats,
      };
    }

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };

    case "SEND_MESSAGE": {
      const { chatId, message } = action.payload;
      const chatToUpdate = state.chats.find((c) => c.id === chatId);
      if (!chatToUpdate) return state;

      const otherChats = state.chats.filter((c) => c.id !== chatId);
      const updatedChat = {
        ...chatToUpdate,
        lastMessage: `${message.senderUsername}: ${message.textContent}`,
      };

      // Don't add message - WebSocket will handle it for both sender and receiver
      return {
        ...state,
        chats: [updatedChat, ...otherChats],
      };
    }

    case "SET_CHATS":
      return { ...state, chats: action.payload };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      };

    case "ADD_MESSAGE": {
      const message = action.payload;
      const chatId = message.chatRoomId;

      // Update messages
      const currentMessages = state.messages[chatId] || [];
      
      // Check if this exact message already exists (by ID)
      const messageExists = currentMessages.some((m) => m.id === message.id);
      
      if (messageExists) {
        console.log("ADD_MESSAGE - Duplicate message, skipping:", message.id);
        return state; // Already have this message, skip
      }
      
      const updatedMessages = [...currentMessages, message];

      // Update chat list
      const chatToUpdate = state.chats.find((c) => c.id === chatId);
      if (!chatToUpdate) return state;

      const otherChats = state.chats.filter((c) => c.id !== chatId);
      const isCurrentChat = state.currentChatId === chatId;

      const updatedChat = {
        ...chatToUpdate,
        lastMessage: `${message.senderUsername}: ${message.textContent}`,
        unreadCount: isCurrentChat ? 0 : chatToUpdate.unreadCount + 1,
      };

      return {
        ...state,
        chats: [updatedChat, ...otherChats],
        messages: {
          ...state.messages,
          [chatId]: updatedMessages,
        },
      };
    }

    case "UPDATE_CHAT_UNREAD":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? { ...chat, unreadCount: action.payload.count }
            : chat
        ),
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    default:
      return state;
  }
}
