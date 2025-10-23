import type { AppState, Action } from '@/types/chat';

export function chatReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
      case 'SELECT_CHAT': {
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

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SEND_MESSAGE': {
      const { chatId, message } = action.payload;
      const chatToUpdate = state.chats.find((c) => c.id === chatId);
      if (!chatToUpdate) return state;

      const otherChats = state.chats.filter((c) => c.id !== chatId);
      const updatedChat = {
        ...chatToUpdate,
        lastMessage: { content: message.content, createdAt: message.createdAt },
      };

      return {
        ...state,
        chats: [updatedChat, ...otherChats],
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), message],
        },
      };
    }

    default:
      return state;
  }
}
