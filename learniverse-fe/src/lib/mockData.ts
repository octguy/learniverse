import type { User, Chat, Message, AppState } from '../types/chat';

export const mockUser: User = {
  id: 'user_1',
  displayName: 'Bạn',
  avatar: 'https://github.com/shadcn.png',
};

export const initialChats: Chat[] = [
  {
    id: 'chat_1',
    name: 'Alice',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    lastMessage: {
      content: 'Chào bạn, khỏe không?',
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    unreadCount: 2,
  },
  {
    id: 'chat_2',
    name: 'Bob',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    lastMessage: {
      content: 'Đang làm gì đó?',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    unreadCount: 0,
  },
  {
    id: 'chat_3',
    name: 'Nhóm Thảo Luận',
    avatar: null,
    lastMessage: {
      content: 'Bob: Gửi file nhé.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    unreadCount: 1,
  },
  {
    id: 'chat_4',
    name: 'Emma',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    lastMessage: {
      content: 'Hôm nay đi cafe nhé ☕',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    unreadCount: 0,
  },
  {
    id: 'chat_5',
    name: 'David',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    lastMessage: {
      content: 'Nhớ gửi báo cáo hôm qua nhen!',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    unreadCount: 3,
  },
];

export const initialMessages: Record<string, Message[]> = {
  chat_1: [
    {
      id: 'msg_1',
      content: 'Chào bạn!',
      senderId: 'user_2',
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: 'msg_2',
      content: 'Chào bạn, khỏe không?',
      senderId: 'user_1',
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
  ],
  chat_2: [
    {
      id: 'msg_3',
      content: 'Đang làm gì đó?',
      senderId: 'user_3',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'msg_4',
      content: 'Xem phim thôi 😎',
      senderId: 'user_1',
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
  ],
  chat_3: [
    {
      id: 'msg_5',
      content: 'Mọi người ơi, họp lúc 8h nhé!',
      senderId: 'user_4',
      createdAt: new Date(Date.now() - 8000000).toISOString(),
    },
    {
      id: 'msg_6',
      content: 'Ok luôn!',
      senderId: 'user_2',
      createdAt: new Date(Date.now() - 7800000).toISOString(),
    },
    {
      id: 'msg_7',
      content: 'Bob: Gửi file nhé.',
      senderId: 'user_3',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  chat_4: [
    {
      id: 'msg_8',
      content: 'Hôm nay đi cafe nhé ☕',
      senderId: 'user_4',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'msg_9',
      content: 'Ok luôn, quán cũ nha 😁',
      senderId: 'user_1',
      createdAt: new Date(Date.now() - 3300000).toISOString(),
    },
  ],
  chat_5: [
    {
      id: 'msg_10',
      content: 'Nhớ gửi báo cáo hôm qua nhen!',
      senderId: 'user_5',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: 'msg_11',
      content: 'Rồi, xong rồi nè!',
      senderId: 'user_1',
      createdAt: new Date(Date.now() - 5100000).toISOString(),
    },
  ],
};

export const initialState: AppState = {
  chats: initialChats,
  messages: initialMessages,
  currentChatId: null,
  searchQuery: '',
};
