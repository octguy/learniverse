"use client";

import React, {
  useMemo,
  useReducer,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import WelcomeScreen from "@/components/chat/WellcomeScreen";
import { chatReducer } from "./state/chatReducer";
import { chatService, MessageDTO, ChatRoomDTO } from "@/lib/api/chatService";
import { websocketService } from "@/lib/websocketService";
import { Chat, Message } from "@/types/chat";
import { toast } from "sonner";

const initialState = {
  chats: [],
  messages: {},
  currentChatId: null,
  searchQuery: "",
  loading: true,
};

export default function ChatPage() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { chats, messages, currentChatId, searchQuery, loading } = state;
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Load initial data
  useEffect(() => {
    const loadChats = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        // Get current user ID from session storage
        const userStr = sessionStorage.getItem("user");
        let userId = "";
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            userId = userObj.id || "";
          } catch (e) {
            console.error("Error parsing user from sessionStorage:", e);
          }
        }
        setCurrentUserId(userId);

        // Fetch all chats
        const response = await chatService.getAllChats();
        if (response.data.status === "success") {
          const chatRooms = response.data.data;

          // Convert to Chat format
          const chatsWithData = chatRooms.map((room: ChatRoomDTO) => {
            // Convert last message if it exists
            let lastMessage = null;
            if (room.lastMessage) {
              // Show "You:" if the message is from the current user
              const senderPrefix = room.lastMessage.senderId === userId 
                ? "You" 
                : room.lastMessage.senderName;
              lastMessage = `${senderPrefix}: ${room.lastMessage.textContent}`;
            }

            return {
              id: room.id,
              name: room.name || "Direct Chat",
              avatar: null,
              lastMessage,
              unreadCount: room.unreadCount || 0,
              participants: room.participants,
              isGroupChat: room.groupChat,
            } as Chat;
          });

          dispatch({ type: "SET_CHATS", payload: chatsWithData });
        }
      } catch (error: any) {
        console.error("Error loading chats:", error);
        toast.error("Không thể tải danh sách chat");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadChats();
  }, []);

  // Connect WebSocket
  useEffect(() => {
    let isSubscribed = true;

    const connectWS = async () => {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      if (!isSubscribed) return;

      try {
        await websocketService.connect(token);
        if (isSubscribed) {
          console.log("WebSocket connected successfully");
        }
      } catch (error: any) {
        if (isSubscribed) {
          console.error("WebSocket connection failed:", error);
          // Check if it's a 401 error
          const is401 =
            error?.message?.includes("401") ||
            error?.message?.includes("Unauthorized");
          if (is401) {
            toast.error(
              "WebSocket connection failed: Backend security configuration needed. Check WEBSOCKET_401_FIX.md"
            );
          } else {
            toast.error("Không thể kết nối WebSocket");
          }
        }
      }
    };

    connectWS();

    return () => {
      isSubscribed = false;
      // Don't disconnect on cleanup as other components might be using it
      // websocketService.disconnect();
    };
  }, []);

  // Subscribe to current chat messages
  useEffect(() => {
    if (!currentChatId || !websocketService.isConnected()) return;

    const unsubscribe = websocketService.subscribeToChat(
      currentChatId,
      (message: MessageDTO) => {
        const msg: Message = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          senderUsername: message.senderName || message.senderUsername || "",
          messageType: message.messageType,
          textContent: message.textContent,
          createdAt: message.sendAt || message.createdAt || new Date().toISOString(),
          updatedAt: message.updatedAt,
        };

        dispatch({ type: "ADD_MESSAGE", payload: msg });

        // Mark as read if not sent by current user
        if (message.senderId !== currentUserId) {
          chatService.markMessageAsRead(message.id).catch(console.error);
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentChatId, currentUserId]);

  // Load messages when chat is selected
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const response = await chatService.getChatHistory(chatId, 0, 100);
      
      if (response.data.status === "success" && response.data.data?.messages) {
        const msgs = response.data.data.messages.map(
          (m: any) =>
            ({
              id: m.id,
              chatRoomId: m.chatRoomId,
              senderId: m.senderId,
              senderUsername: m.senderName, // API returns senderName, map to senderUsername
              messageType: m.messageType,
              textContent: m.textContent,
              createdAt: m.sendAt || m.createdAt, // API uses sendAt
              updatedAt: m.updatedAt,
            } as Message)
        ).reverse(); // Reverse to show oldest first (top) to newest (bottom)

        dispatch({ type: "SET_MESSAGES", payload: { chatId, messages: msgs } });

        // Mark all as read
        try {
          await chatService.markAllAsRead(chatId);
          dispatch({
            type: "UPDATE_CHAT_UNREAD",
            payload: { chatId, count: 0 },
          });
        } catch (markReadError) {
          console.warn("Could not mark messages as read:", markReadError);
        }
      } else {
        // Handle case where response structure is unexpected
        console.warn("Unexpected response structure:", response.data);
        dispatch({ type: "SET_MESSAGES", payload: { chatId, messages: [] } });
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể tải tin nhắn. Vui lòng thử lại.";
      toast.error(errorMessage);
      // Set empty messages array to show "no messages" UI instead of error
      dispatch({ type: "SET_MESSAGES", payload: { chatId, messages: [] } });
    }
  }, []);

  const filteredChats = useMemo(
    () =>
      chats.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [chats, searchQuery]
  );

  const currentChat = useMemo(
    () => chats.find((c) => c.id === currentChatId) || null,
    [chats, currentChatId]
  );

  const handleSelect = (id: string) => {
    dispatch({ type: "SELECT_CHAT", payload: id });
    loadMessages(id);
  };

  const handleSearch = (q: string) =>
    dispatch({ type: "SET_SEARCH_QUERY", payload: q });

  const handleSend = async (chatId: string, textContent: string) => {
    try {
      const response = await chatService.sendMessage({
        chatRoomId: chatId,
        messageType: "TEXT",
        textContent,
      });

      if (response.data.status === "success") {
        const message = response.data.data;
        const msg: Message = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          senderUsername: message.senderName || message.senderUsername || "",
          messageType: message.messageType,
          textContent: message.textContent,
          createdAt: message.sendAt || message.createdAt || new Date().toISOString(),
          updatedAt: message.updatedAt,
        };

        dispatch({ type: "SEND_MESSAGE", payload: { chatId, message: msg } });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 rounded-lg shadow-sm overflow-hidden">
      {/* Left panel */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Tin nhắn</h1>
            <Button size="icon" variant="ghost">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ChatList
          chats={filteredChats}
          currentChatId={currentChatId}
          onSelect={handleSelect}
        />
      </div>

      {/* Main panel */}
      {currentChat ? (
        <ChatWindow
          chat={currentChat}
          messages={messages[currentChat.id] || []}
          userId={currentUserId}
          onSend={handleSend}
        />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}
