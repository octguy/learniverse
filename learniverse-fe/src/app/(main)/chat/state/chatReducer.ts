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
      // WebSocket will handle updating the message list and last message
      // Just return state as-is
      return state;
    }

    case "SET_USER_ID":
      return { ...state, currentUserId: action.payload };

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

    case "SET_MESSAGES_WITH_CURSOR":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
        messageCursors: {
          ...state.messageCursors,
          [action.payload.chatId]: action.payload.nextCursor,
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [action.payload.chatId]: action.payload.hasNext,
        },
      };

    case "PREPEND_MESSAGES": {
      const {
        chatId,
        messages: newMessages,
        nextCursor,
        hasNext,
      } = action.payload;
      const currentMessages = state.messages[chatId] || [];

      // Filter out any duplicates
      const existingIds = new Set(currentMessages.map((m) => m.id));
      const uniqueNewMessages = newMessages.filter(
        (m) => !existingIds.has(m.id)
      );

      console.log("[REDUCER] PREPEND_MESSAGES:", {
        chatId,
        newCount: newMessages.length,
        uniqueCount: uniqueNewMessages.length,
        existingCount: currentMessages.length,
      });

      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...uniqueNewMessages, ...currentMessages],
        },
        messageCursors: {
          ...state.messageCursors,
          [chatId]: nextCursor,
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [chatId]: hasNext,
        },
        loadingMore: {
          ...state.loadingMore,
          [chatId]: false,
        },
      };
    }

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

      // Use "You:" if message is from current user
      const senderPrefix =
        message.senderId === state.currentUserId
          ? "You"
          : message.senderUsername;

      const updatedChat = {
        ...chatToUpdate,
        lastMessage: `${senderPrefix}: ${message.textContent}`,
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

    case "SET_LOADING_MORE":
      return {
        ...state,
        loadingMore: {
          ...state.loadingMore,
          [action.payload.chatId]: action.payload.loading,
        },
      };

    default:
      return state;
  }
}
