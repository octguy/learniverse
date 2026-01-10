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
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { chatReducer } from "./state/chatReducer";
import { chatService, MessageDTO, ChatRoomDTO } from "@/lib/api/chatService";
import { userProfileService } from "@/lib/api/userProfileService";
import { websocketService } from "@/lib/websocketService";
import { Chat, Message } from "@/types/chat";
import { toast } from "sonner";
import { useNotification } from "@/context/NotificationContext";
import { friendService } from "@/lib/api/friendService";
import { SuggestedFriend } from "@/types/friend";

const initialState = {
  chats: [],
  messages: {},
  currentChatId: null,
  searchQuery: "",
  loading: true,
  messageCursors: {},
  hasMoreMessages: {},
  loadingMore: {},
  currentUserId: null,
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
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { refreshMessages } = useNotification();
  const [friends, setFriends] = useState<SuggestedFriend[]>([]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await friendService.getFriends();
        if (res.data.status === "success") {
          setFriends(res.data.data);
        }
      } catch (e) {
        console.error("Failed to load friends", e);
      }
    };
    loadFriends();
  }, []);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return friends.filter((f) => {
      const name = f.displayName || f.username || "";
      return name.toLowerCase().includes(query);
    });
  }, [friends, searchQuery]);

  const handleSelectFriend = async (friendId: string) => {
    const existingChat = chats.find(
      (c) => !c.isGroupChat && c.participants.includes(friendId)
    );

    if (existingChat) {
      dispatch({ type: "SELECT_CHAT", payload: existingChat.id });
      dispatch({ type: "SET_SEARCH_QUERY", payload: "" });
      loadMessages(existingChat.id);
      return;
    }

    try {
      const res = await chatService.createDirectChat(friendId);
      if (res.data.status === "success") {
        const chat = res.data.data;
        await reloadChats();
        await refreshMessages(); // Trigger global subscription update for the new chat
        dispatch({ type: "SELECT_CHAT", payload: chat.id });
        dispatch({ type: "SET_SEARCH_QUERY", payload: "" });
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error("Không thể tạo cuộc trò chuyện");
    }
  };

  // Define reloadChats here to be used by the modal
  const reloadChats = async () => {
    try {
      const response = await chatService.getAllChats();
      if (response.data.status === "success") {
        const chatRooms = response.data.data;
        const chatsWithData = await Promise.all(
          chatRooms.map(async (room: ChatRoomDTO) => {
            let lastMessage = null;
            if (room.lastMessage) {
              const senderPrefix =
                room.lastMessage.senderId === currentUserId
                  ? "You"
                  : room.lastMessage.senderName || "Unknown";

              let content = room.lastMessage.content;
              if (room.lastMessage.messageType === "IMAGE")
                content = "[Hình ảnh]";
              else if (room.lastMessage.messageType === "VIDEO")
                content = "[Video]";
              else if (room.lastMessage.messageType === "FILE")
                content = "[Tệp tin]";

              lastMessage = `${senderPrefix}: ${content || ""}`;
            }

            let avatar = null;
            let chatName = room.name || "Direct Chat";

            if (!room.groupChat && room.participants.length === 2) {
              const recipientId = room.participants.find(
                (participantId) => participantId !== currentUserId
              );
              if (recipientId) {
                try {
                  const userProfile = await userProfileService.getUserProfile(
                    recipientId
                  );
                  avatar = userProfile.avatarUrl;
                  chatName =
                    userProfile.displayName ||
                    userProfile.user.username ||
                    "Direct Chat";
                } catch (error) {
                  console.error("Error fetching profile", error);
                }
              }
            }

            return {
              id: room.id,
              name: chatName,
              avatar,
              lastMessage,
              unreadCount: room.unreadCount || 0,
              participants: room.participants,
              isGroupChat: room.groupChat,
            } as Chat;
          })
        );
        dispatch({ type: "SET_CHATS", payload: chatsWithData });
      }
    } catch (e) {
      console.error("Failed to reload chats", e);
    }
  };

  // Set user ID in reducer when available
  useEffect(() => {
    if (currentUserId) {
      dispatch({ type: "SET_USER_ID", payload: currentUserId });
    }
  }, [currentUserId]);

  // Load initial data
  useEffect(() => {
    const loadChats = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        // Get current user ID from local storage
        const userStr = localStorage.getItem("user");
        let userId = "";
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            userId = userObj.id || "";
            console.log("[CHAT] Current user ID:", userId);
          } catch (e) {
            console.error("[CHAT] ❌ Error parsing user from localStorage:", e);
          }
        }
        setCurrentUserId(userId);

        // Fetch all chats
        const response = await chatService.getAllChats();
        if (response.data.status === "success") {
          const chatRooms = response.data.data;

          // Convert to Chat format and fetch avatars for direct chats
          const chatsWithData = await Promise.all(
            chatRooms.map(async (room: ChatRoomDTO) => {
              // Convert last message if it exists
              let lastMessage = null;
              if (room.lastMessage) {
                // Show "You:" if the message is from the current user
                const senderPrefix =
                  room.lastMessage.senderId === userId
                    ? "You"
                    : room.lastMessage.senderName || "Unknown";

                let content = room.lastMessage.content;
                if (room.lastMessage.messageType === "IMAGE")
                  content = "[Hình ảnh]";
                else if (room.lastMessage.messageType === "VIDEO")
                  content = "[Video]";
                else if (room.lastMessage.messageType === "FILE")
                  content = "[Tệp tin]";

                lastMessage = `${senderPrefix}: ${content || ""}`;
              }

              // Fetch avatar and name for direct chats
              let avatar = null;
              let chatName = room.name || "Direct Chat";

              if (!room.groupChat && room.participants.length === 2) {
                // Find the other participant (not current user)
                const recipientId = room.participants.find(
                  (participantId) => participantId !== userId
                );
                if (recipientId) {
                  try {
                    const userProfile = await userProfileService.getUserProfile(
                      recipientId
                    );
                    avatar = userProfile.avatarUrl;
                    // Use recipient's display name or username as chat name for direct messages
                    chatName =
                      userProfile.displayName ||
                      userProfile.user.username ||
                      "Direct Chat";
                  } catch (error) {
                    console.error(
                      `[CHAT] ❌ Error fetching profile for user ${recipientId}:`,
                      error
                    );
                  }
                }
              }

              const chat = {
                id: room.id,
                name: chatName,
                avatar,
                lastMessage,
                unreadCount: room.unreadCount || 0,
                participants: room.participants,
                isGroupChat: room.groupChat,
              } as Chat;

              return chat;
            })
          );

          dispatch({ type: "SET_CHATS", payload: chatsWithData });
        }
      } catch (error: any) {
        console.error("[CHAT] ❌ Error loading chats:", error);
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
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("[WEBSOCKET] ❌ No access token found");
        return;
      }

      if (!isSubscribed) return;

      try {
        await websocketService.connect(token);
      } catch (error: any) {
        if (isSubscribed) {
          console.error("[WEBSOCKET] ❌ Connection failed:", error);
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

  // Subscribe to ALL user's chats to update chat list when new messages arrive
  useEffect(() => {
    if (!websocketService.isConnected() || chats.length === 0) {
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Subscribe to each chat room
    chats.forEach((chat) => {
      const unsubscribe = websocketService.subscribeToChat(
        chat.id,
        (message: MessageDTO) => {
          const msg: Message = {
            id: message.id,
            chatRoomId: message.chatRoomId,
            senderId: message.sender.senderId,
            senderUsername: message.sender.senderName,
            senderAvatar: message.sender.senderAvatar,
            messageType: message.messageType,
            textContent: message.textContent,
            metadata: message.metadata,
            parentMessageId: message.parentMessageId,
            createdAt: message.createdAt,
          };

          console.log("[CHAT] 📨 Received message for chat:", chat.id, msg);
          dispatch({ type: "ADD_MESSAGE", payload: msg });
        }
      );

      if (unsubscribe) {
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [chats, currentUserId]);

  // Subscribe to current chat messages
  useEffect(() => {
    if (!currentChatId || !websocketService.isConnected()) {
      return;
    }

    const unsubscribe = websocketService.subscribeToChat(
      currentChatId,
      (message: MessageDTO) => {
        const msg: Message = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.sender.senderId,
          senderUsername: message.sender.senderName,
          senderAvatar: message.sender.senderAvatar,
          messageType: message.messageType,
          textContent: message.textContent,
          metadata: message.metadata,
          parentMessageId: message.parentMessageId,
          createdAt: message.createdAt,
        };

        dispatch({ type: "ADD_MESSAGE", payload: msg });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentChatId, currentUserId]);

  // Load messages when chat is selected
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const response = await chatService.getChatHistory(chatId, undefined, 20);

      if (response.data.status === "success" && response.data.data?.data) {
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
              metadata: m.metadata,
              parentMessageId: m.parentMessageId,
              createdAt: m.createdAt,
            } as Message;
          })
          .reverse(); // Reverse to show oldest first (top) to newest (bottom)

        const pagination = response.data.data.pagination;

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
        dispatch({ type: "SET_MESSAGES", payload: { chatId, messages: [] } });
      }
    } catch (error: any) {
      console.error("[MESSAGES] ❌ Error loading messages:", error);
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
        return;
      }

      const cursor = messageCursors[chatId];
      if (!cursor) {
        return;
      }

      try {
        console.log("[CHAT] ⬆️ Loading more messages (reached top)...");
        dispatch({
          type: "SET_LOADING_MORE",
          payload: { chatId, loading: true },
        });

        const response = await chatService.getChatHistory(chatId, cursor, 20);

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
    dispatch({ type: "SELECT_CHAT", payload: id });
    loadMessages(id);
    // Mark as read in backend
    chatService.markAsRead(id).then(() => {
      refreshMessages(); // Update global count
    });
  };

  const handleSearch = (q: string) =>
    dispatch({ type: "SET_SEARCH_QUERY", payload: q });

  const handleSend = async (
    chatId: string,
    textContent: string,
    parentMessageId?: string
  ) => {
    try {
      const response = await chatService.sendMessage(chatId, {
        textContent,
        parentMessageId,
      });

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
          metadata: message.metadata,
          parentMessageId: message.parentMessageId,
          createdAt: message.createdAt,
        };

        dispatch({ type: "SEND_MESSAGE", payload: { chatId, message: msg } });
      }
    } catch (error: any) {
      console.error("[SEND] ❌ Error sending message:", error);
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
    <div className="flex rounded-lg shadow-sm overflow-hidden bg-white h-[calc(100vh-120px)]">
      {/* Left panel */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Tin nhắn</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsCreateGroupOpen(true)}
              title="Tạo nhóm mới"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <CreateGroupModal
            open={isCreateGroupOpen}
            onOpenChange={setIsCreateGroupOpen}
            onGroupCreated={reloadChats}
          />
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
          friends={filteredFriends}
          currentChatId={currentChatId}
          onSelect={handleSelect}
          onSelectFriend={handleSelectFriend}
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
