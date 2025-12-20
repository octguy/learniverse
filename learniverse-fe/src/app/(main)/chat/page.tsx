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
  messageCursors: {},
  hasMoreMessages: {},
  loadingMore: {},
};

export default function ChatPage() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const {
    chats,
    messages,
    currentChatId,
    searchQuery,
    loading,
    messageCursors,
    hasMoreMessages,
    loadingMore,
  } = state;
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Load initial data
  useEffect(() => {
    const loadChats = async () => {
      try {
        console.log("[CHAT] 🔄 Loading chats...");
        dispatch({ type: "SET_LOADING", payload: true });
        // Get current user ID from session storage
        const userStr = sessionStorage.getItem("user");
        let userId = "";
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            userId = userObj.id || "";
            console.log("[CHAT] 👤 Current user ID:", userId);
          } catch (e) {
            console.error(
              "[CHAT] ❌ Error parsing user from sessionStorage:",
              e
            );
          }
        }
        setCurrentUserId(userId);

        // Fetch all chats
        console.log("[CHAT] 📡 Fetching all chats from API...");
        const response = await chatService.getAllChats();
        console.log(
          "[CHAT] 📥 getAllChats response:",
          JSON.stringify(response.data, null, 2)
        );
        if (response.data.status === "success") {
          const chatRooms = response.data.data;
          console.log("[CHAT] 💬 Number of chat rooms:", chatRooms.length);

          // Convert to Chat format
          const chatsWithData = chatRooms.map((room: ChatRoomDTO) => {
            console.log(
              "[CHAT] 🔄 Mapping room:",
              room.id,
              "Last message:",
              room.lastMessage
            );
            // Convert last message if it exists
            let lastMessage = null;
            if (room.lastMessage) {
              // Show "You:" if the message is from the current user
              const senderPrefix =
                room.lastMessage.sender.senderId === userId
                  ? "You"
                  : room.lastMessage.sender.senderName;
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

          console.log(
            "[CHAT] ✅ Chats loaded successfully:",
            chatsWithData.length
          );
          dispatch({ type: "SET_CHATS", payload: chatsWithData });
        }
      } catch (error: any) {
        console.error("[CHAT] ❌ Error loading chats:", error);
        console.error("[CHAT] ❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error("Không thể tải danh sách chat");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
        console.log("[CHAT] 🏁 Load chats finished");
      }
    };

    loadChats();
  }, []);

  // Connect WebSocket
  useEffect(() => {
    let isSubscribed = true;

    const connectWS = async () => {
      console.log("[WEBSOCKET] 🔌 Attempting to connect...");
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        console.error("[WEBSOCKET] ❌ No access token found");
        return;
      }

      if (!isSubscribed) return;

      try {
        await websocketService.connect(token);
        if (isSubscribed) {
          console.log("[WEBSOCKET] ✅ Connected successfully");
        }
      } catch (error: any) {
        if (isSubscribed) {
          console.error("[WEBSOCKET] ❌ Connection failed:", error);
          console.error("[WEBSOCKET] ❌ Error details:", {
            message: error.message,
            stack: error.stack,
          });
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
    if (!currentChatId || !websocketService.isConnected()) {
      console.log(
        "[WEBSOCKET] ⏸️ Not subscribing - chatId:",
        currentChatId,
        "connected:",
        websocketService.isConnected()
      );
      return;
    }

    console.log("[WEBSOCKET] 📡 Subscribing to chat:", currentChatId);
    const unsubscribe = websocketService.subscribeToChat(
      currentChatId,
      (message: MessageDTO) => {
        console.log(
          "[WEBSOCKET] 📨 Received message:",
          JSON.stringify(message, null, 2)
        );
        const msg: Message = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.sender.senderId,
          senderUsername: message.sender.senderName,
          senderAvatar: message.sender.senderAvatar,
          messageType: message.messageType,
          textContent: message.textContent,
          createdAt: message.createdAt,
        };

        console.log("[WEBSOCKET] ✅ Message transformed:", msg);
        dispatch({ type: "ADD_MESSAGE", payload: msg });
      }
    );

    return () => {
      console.log("[WEBSOCKET] 🔌 Unsubscribing from chat:", currentChatId);
      if (unsubscribe) unsubscribe();
    };
  }, [currentChatId, currentUserId]);

  // Load messages when chat is selected
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      console.log("[MESSAGES] 📡 Loading initial messages for chat:", chatId);
      const response = await chatService.getChatHistory(chatId, undefined, 20);
      console.log(
        "[MESSAGES] 📥 getChatHistory response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.status === "success" && response.data.data?.data) {
        console.log(
          "[MESSAGES] 💬 Number of messages:",
          response.data.data.data.length
        );
        const msgs = response.data.data.data
          .map((m: MessageDTO) => {
            return {
              id: m.id,
              chatRoomId: m.chatRoomId,
              senderId: m.sender.senderId,
              senderUsername: m.sender.senderName,
              senderAvatar: m.sender.senderAvatar,
              messageType: m.messageType,
              textContent: m.textContent,
              createdAt: m.createdAt,
            } as Message;
          })
          .reverse(); // Reverse to show oldest first (top) to newest (bottom)

        const pagination = response.data.data.pagination;
        console.log(
          "[MESSAGES] ✅ Messages loaded and transformed:",
          msgs.length
        );
        console.log("[MESSAGES] 📄 Pagination:", pagination);

        dispatch({
          type: "SET_MESSAGES_WITH_CURSOR",
          payload: {
            chatId,
            messages: msgs,
            nextCursor: pagination.nextCursor,
            hasNext: pagination.hasNext,
          },
        });
      } else {
        // Handle case where response structure is unexpected
        console.warn(
          "[MESSAGES] ⚠️ Unexpected response structure:",
          response.data
        );
        dispatch({ type: "SET_MESSAGES", payload: { chatId, messages: [] } });
      }
    } catch (error: any) {
      console.error("[MESSAGES] ❌ Error loading messages:", error);
      console.error("[MESSAGES] ❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.message ||
        "Không thể tải tin nhắn. Vui lòng thử lại.";
      toast.error(errorMessage);
      // Set empty messages array to show "no messages" UI instead of error
      dispatch({ type: "SET_MESSAGES", payload: { chatId, messages: [] } });
    }
  }, []);

  // Load more messages when scrolling up
  const loadMoreMessages = useCallback(
    async (chatId: string) => {
      // Check if already loading or no more messages
      if (loadingMore[chatId] || !hasMoreMessages[chatId]) {
        console.log("[MESSAGES] ⏸️ Skip loading more:", {
          loading: loadingMore[chatId],
          hasMore: hasMoreMessages[chatId],
        });
        return;
      }

      const cursor = messageCursors[chatId];
      if (!cursor) {
        console.log("[MESSAGES] ⚠️ No cursor available for chat:", chatId);
        return;
      }

      try {
        console.log("[MESSAGES] ⬆️ Loading more messages with cursor:", cursor);
        dispatch({
          type: "SET_LOADING_MORE",
          payload: { chatId, loading: true },
        });

        const response = await chatService.getChatHistory(chatId, cursor, 20);
        console.log(
          "[MESSAGES] 📥 Load more response:",
          JSON.stringify(response.data, null, 2)
        );

        if (response.data.status === "success" && response.data.data?.data) {
          const msgs = response.data.data.data
            .map(
              (m: MessageDTO) =>
                ({
                  id: m.id,
                  chatRoomId: m.chatRoomId,
                  senderId: m.sender.senderId,
                  senderUsername: m.sender.senderName,
                  senderAvatar: m.sender.senderAvatar,
                  messageType: m.messageType,
                  textContent: m.textContent,
                  createdAt: m.createdAt,
                } as Message)
            )
            .reverse();

          const pagination = response.data.data.pagination;
          console.log(
            "[MESSAGES] ✅ Loaded",
            msgs.length,
            "more messages. HasNext:",
            pagination.hasNext
          );

          dispatch({
            type: "PREPEND_MESSAGES",
            payload: {
              chatId,
              messages: msgs,
              nextCursor: pagination.nextCursor,
              hasNext: pagination.hasNext,
            },
          });
        } else {
          console.warn("[MESSAGES] ⚠️ Unexpected response:", response.data);
          dispatch({
            type: "SET_LOADING_MORE",
            payload: { chatId, loading: false },
          });
        }
      } catch (error: any) {
        console.error("[MESSAGES] ❌ Error loading more messages:", error);
        dispatch({
          type: "SET_LOADING_MORE",
          payload: { chatId, loading: false },
        });
      }
    },
    [loadingMore, hasMoreMessages, messageCursors]
  );

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
    console.log("[CHAT] 🎯 Selecting chat:", id);
    dispatch({ type: "SELECT_CHAT", payload: id });
    loadMessages(id);
  };

  const handleSearch = (q: string) =>
    dispatch({ type: "SET_SEARCH_QUERY", payload: q });

  const handleSend = async (chatId: string, textContent: string) => {
    try {
      console.log("[SEND] 📤 Sending message to chat:", chatId);
      console.log("[SEND] 📝 Message content:", textContent);
      const response = await chatService.sendMessage(chatId, {
        textContent,
      });
      console.log(
        "[SEND] 📥 Send response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.status === "success") {
        const message = response.data.data;
        const msg: Message = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.sender.senderId,
          senderUsername: message.sender.senderName,
          senderAvatar: message.sender.senderAvatar,
          messageType: message.messageType,
          textContent: message.textContent,
          createdAt: message.createdAt,
        };

        console.log("[SEND] ✅ Message sent successfully:", msg.id);
        dispatch({ type: "SEND_MESSAGE", payload: { chatId, message: msg } });
      }
    } catch (error: any) {
      console.error("[SEND] ❌ Error sending message:", error);
      console.error("[SEND] ❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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
    <div className="flex rounded-lg shadow-sm overflow-hidden bg-white h-full">
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
          onLoadMore={() => loadMoreMessages(currentChat.id)}
          hasMore={hasMoreMessages[currentChat.id] ?? true}
          loadingMore={loadingMore[currentChat.id] ?? false}
        />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}
