"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { websocketService } from "@/lib/websocketService";
import { notificationService } from "@/lib/api/notificationService";
import { chatService } from "@/lib/api/chatService";
import { friendService } from "@/lib/api/friendService";
import { toast } from "sonner";

interface NotificationContextType {
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  pendingFriendRequestsCount: number;
  refreshNotifications: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);
  const [audio] = useState<HTMLAudioElement | null>(typeof Audio !== "undefined" ? new Audio("/sounds/notification.mp3") : null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const unlockAudio = () => {
      setHasInteracted(true);
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, [audio]);

  const playNotificationSound = () => {
    if (audio && hasInteracted) {
      audio.currentTime = 0;
      audio.play().catch((e) => {
        if (e.name !== 'NotAllowedError') {
            console.error("Error playing sound:", e);
        }
      });
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadNotificationsCount(count);
    } catch (error) {
      console.error("Failed to fetch unread notifications count", error);
    }
  };

  const refreshMessages = async () => {
    if (!user) return;
    try {
      const chats = await chatService.getAllChats();
      if (chats.data.status === "success") {
        const count = chats.data.data.reduce((acc, chat) => acc + chat.unreadCount, 0);
        setUnreadMessagesCount(count);
      }
    } catch (error) {
      console.error("Failed to fetch unread messages count", error);
    }
  };

  const refreshFriendRequests = async () => {
    if (!user) return;
    try {
      const requests = await friendService.getFriendRequests();
      if (requests.data.status === "success") {
        setPendingFriendRequestsCount(requests.data.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch friend requests count", error);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      refreshNotifications();
      refreshMessages();
      refreshFriendRequests();
      let chatSubscriptions: (() => void)[] = [];
      
      const subscribeToAllChats = async () => {
        try {
            if (!websocketService.isConnected()) {
                await websocketService.connect(accessToken);
            }

            const response = await chatService.getAllChats();
            if (response.data.status === "success") {
                const chats = response.data.data;
                const count = chats.reduce((acc, chat) => acc + chat.unreadCount, 0);
                setUnreadMessagesCount(count);

                chats.forEach(chat => {
                    const sub = websocketService.subscribeToChat(chat.id, (message) => {
                        if (message.sender.senderId !== user.id) {
                            playNotificationSound();
                            setUnreadMessagesCount(prev => prev + 1);
                            toast.info(`New message from ${message.sender.senderName}`);
                        }
                    });
                    if (sub) chatSubscriptions.push(sub);
                });
            }
        } catch (e) {
            console.error("Failed to subscribe to chats for notifications", e);
        }
      };

      subscribeToAllChats();

      return () => {
        chatSubscriptions.forEach(sub => sub());
      };
    }
  }, [user, accessToken]);

  return (
    <NotificationContext.Provider
      value={{
        unreadNotificationsCount,
        unreadMessagesCount,
        pendingFriendRequestsCount,
        refreshNotifications,
        refreshMessages,
        refreshFriendRequests,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
