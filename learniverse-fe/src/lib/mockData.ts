import type { User, Chat, Message, AppState } from "../types/chat";
import type { Notification } from "../types/notification";
export const mockUser: User = {
  id: "user_1",
  displayName: "Bạn",
  avatar: "https://github.com/shadcn.png",
};

export const initialChats: Chat[] = [
  {
    id: "chat_1",
    name: "Alice",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    lastMessage: {
      content: "Chào bạn, khỏe không?",
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    unreadCount: 2,
    participants: ["user_1", "user_2"],
    isGroupChat: false,
  },
  {
    id: "chat_2",
    name: "Bob",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    lastMessage: {
      content: "Đang làm gì đó?",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    unreadCount: 0,
    participants: ["user_1", "user_3"],
    isGroupChat: false,
  },
  {
    id: "chat_3",
    name: "Nhóm Thảo Luận",
    avatar: null,
    lastMessage: {
      content: "Bob: Gửi file nhé.",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    unreadCount: 1,
    participants: ["user_1", "user_2", "user_3", "user_4"],
    isGroupChat: true,
  },
  {
    id: "chat_4",
    name: "Emma",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    lastMessage: {
      content: "Hôm nay đi cafe nhé ☕",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    unreadCount: 0,
    participants: ["user_1", "user_4"],
    isGroupChat: false,
  },
  {
    id: "chat_5",
    name: "David",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    lastMessage: {
      content: "Nhớ gửi báo cáo hôm qua nhen!",
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    unreadCount: 3,
    participants: ["user_1", "user_5"],
    isGroupChat: false,
  },
  {
    id: "chat_6",
    name: "David",
    avatar: "https://randomuser.me/api/portraits/men/8.jpg",
    lastMessage: {
      content: "Nhớ gửi báo cáo hôm qua nhen!",
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    unreadCount: 3,
    participants: ["user_1", "user_6"],
    isGroupChat: false,
  },
];

export const initialMessages: Record<string, Message[]> = {
  chat_1: [
    {
      id: "msg_1",
      chatRoomId: "chat_1",
      senderId: "user_2",
      senderUsername: "Alice",
      messageType: "TEXT",
      textContent: "Chào bạn!",
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "msg_2",
      chatRoomId: "chat_1",
      senderId: "user_1",
      senderUsername: "Bạn",
      messageType: "TEXT",
      textContent: "Chào bạn, khỏe không?",
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
  ],
  chat_2: [
    {
      id: "msg_3",
      chatRoomId: "chat_2",
      senderId: "user_3",
      senderUsername: "Bob",
      messageType: "TEXT",
      textContent: "Đang làm gì đó?",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "msg_4",
      chatRoomId: "chat_2",
      senderId: "user_1",
      senderUsername: "Bạn",
      messageType: "TEXT",
      textContent: "Xem phim thôi 😎",
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
  ],
  chat_3: [
    {
      id: "msg_5",
      chatRoomId: "chat_3",
      senderId: "user_4",
      senderUsername: "Charlie",
      messageType: "TEXT",
      textContent: "Mọi người ơi, họp lúc 8h nhé!",
      createdAt: new Date(Date.now() - 8000000).toISOString(),
    },
    {
      id: "msg_6",
      chatRoomId: "chat_3",
      senderId: "user_2",
      senderUsername: "Alice",
      messageType: "TEXT",
      textContent: "Ok luôn!",
      createdAt: new Date(Date.now() - 7800000).toISOString(),
    },
    {
      id: "msg_7",
      chatRoomId: "chat_3",
      senderId: "user_3",
      senderUsername: "Bob",
      messageType: "TEXT",
      textContent: "Gửi file nhé.",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  chat_4: [
    {
      id: "msg_8",
      chatRoomId: "chat_4",
      senderId: "user_4",
      senderUsername: "Emma",
      messageType: "TEXT",
      textContent: "Hôm nay đi cafe nhé ☕",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg_9",
      chatRoomId: "chat_4",
      senderId: "user_1",
      senderUsername: "Bạn",
      messageType: "TEXT",
      textContent: "Ok luôn, quán cũ nha 😁",
      createdAt: new Date(Date.now() - 3300000).toISOString(),
    },
  ],
  chat_5: [
    {
      id: "msg_10",
      chatRoomId: "chat_5",
      senderId: "user_5",
      senderUsername: "David",
      messageType: "TEXT",
      textContent: "Nhớ gửi báo cáo hôm qua nhen!",
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: "msg_11",
      chatRoomId: "chat_5",
      senderId: "user_1",
      senderUsername: "Bạn",
      messageType: "TEXT",
      textContent: "Rồi, xong rồi nè!",
      createdAt: new Date(Date.now() - 5100000).toISOString(),
    },
  ],
  chat_6: [
    {
      id: "msg_12",
      chatRoomId: "chat_6",
      senderId: "user_6",
      senderUsername: "David",
      messageType: "TEXT",
      textContent: "Nhớ gửi báo cáo hôm qua nhen!",
      createdAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: "msg_13",
      chatRoomId: "chat_6",
      senderId: "user_1",
      senderUsername: "Bạn",
      messageType: "TEXT",
      textContent: "Rồi, xong rồi nè!",
      createdAt: new Date(Date.now() - 5100000).toISOString(),
    },
  ],
};

export const initialState: AppState = {
  chats: initialChats,
  messages: initialMessages,
  currentChatId: null,
  searchQuery: "",
  loading: false,
};
export const mockNotifications: Notification[] = [
  {
    id: "1",
    avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
    text: "<strong>Alice</strong> đã thích bài viết của bạn.",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    read: false,
  },
  {
    id: "2",
    avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    text: "<strong>Bob</strong> đã bình luận về một bài viết trong nhóm <strong>Lập trình</strong>.",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
  {
    id: "3",
    avatarUrl: "https://randomuser.me/api/portraits/women/2.jpg",
    text: "<strong>Emma</strong> đã bắt đầu theo dõi bạn.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
  {
    id: "4",
    avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
    text: "<strong>David</strong> đã gửi cho bạn một tin nhắn.",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    read: true,
  },
  {
    id: "5",
    text: 'Bài viết <strong>"Giới thiệu về React"</strong> của bạn đã được phê duyệt.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
];
