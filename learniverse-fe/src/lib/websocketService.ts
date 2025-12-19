import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { MessageDTO } from "./api/chatService";

export interface TypingEvent {
  userId: string;
  username: string;
  chatRoomId: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  messageId: string;
  userId: string;
  username: string;
  readAt: string;
}

export interface UserStatusEvent {
  userId: string;
  online: boolean;
  lastSeen: string;
}

export interface WebSocketMessage {
  chatRoomId: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  textContent: string;
}

class WebSocketService {
  private client: Client | null = null;
  private reconnectDelay = 5000;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private shouldReconnect = true;
  private lastError: string | null = null;

  connect(token: string): Promise<void> {
    // If already connected, return immediately
    if (this.client?.connected) {
      return Promise.resolve();
    }

    // If connection is in progress, return the existing promise
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection promise
    this.connectionPromise = new Promise((resolve, reject) => {
      this.isConnecting = true;
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          if (process.env.NODE_ENV === "development") {
            console.log("[WebSocket Debug]", str);
          }
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("[WebSocket] Connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          resolve();
        },
        onStompError: (frame) => {
          console.error("[WebSocket] STOMP Error:", frame);
          this.isConnecting = false;
          this.connectionPromise = null;
          reject(
            new Error(frame.headers["message"] || "WebSocket connection error")
          );
        },
        onWebSocketError: (error) => {
          console.error("[WebSocket] Error:", error);

          // Check if it's a 401 error - stop reconnecting
          const errorString = String(error);
          if (
            errorString.includes("401") ||
            errorString.includes("Unauthorized")
          ) {
            this.shouldReconnect = false;
            this.lastError = "401_UNAUTHORIZED";
            console.error(
              "[WebSocket] Authentication failed (401). Backend security configuration needed. See WEBSOCKET_401_FIX.md"
            );
          }

          reject(error);
        },
        onDisconnect: () => {
          console.log("[WebSocket] Disconnected");
          this.isConnecting = false;
          this.connectionPromise = null;

          // Only reconnect if we should (not a 401 error)
          if (this.shouldReconnect) {
            this.handleReconnect(token);
          } else {
            console.warn(
              "[WebSocket] Not reconnecting due to authentication error"
            );
          }
        },
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  private handleReconnect(token: string) {
    // Don't reconnect if we have a permanent error (like 401)
    if (!this.shouldReconnect) {
      console.warn(
        "[WebSocket] Reconnection disabled due to permanent error:",
        this.lastError
      );
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`
      );
      setTimeout(() => {
        this.connect(token).catch(console.error);
      }, this.reconnectDelay);
    } else {
      console.error("[WebSocket] Max reconnection attempts reached");
      this.shouldReconnect = false;
    }
  }

  disconnect() {
    this.shouldReconnect = false; // Prevent reconnection on manual disconnect
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  // Method to reset and allow reconnection (useful for retrying after backend fix)
  reset() {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.lastError = null;
    this.disconnect();
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // Subscribe to chat messages
  subscribeToChat(chatRoomId: string, callback: (message: MessageDTO) => void) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      return null;
    }

    const subscription = this.client.subscribe(
      `/topic/chat/${chatRoomId}`,
      (message) => {
        try {
          const msg: MessageDTO = JSON.parse(message.body);
          callback(msg);
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  // Subscribe to typing indicators
  subscribeToTyping(
    chatRoomId: string,
    callback: (event: TypingEvent) => void
  ) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      return null;
    }

    const subscription = this.client.subscribe(
      `/topic/typing/${chatRoomId}`,
      (message) => {
        try {
          const event: TypingEvent = JSON.parse(message.body);
          callback(event);
        } catch (error) {
          console.error("[WebSocket] Error parsing typing event:", error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  // Subscribe to read receipts
  subscribeToReceipts(
    messageId: string,
    callback: (event: ReadReceiptEvent) => void
  ) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      return null;
    }

    const subscription = this.client.subscribe(
      `/topic/receipts/${messageId}`,
      (message) => {
        try {
          const event: ReadReceiptEvent = JSON.parse(message.body);
          callback(event);
        } catch (error) {
          console.error("[WebSocket] Error parsing receipt event:", error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  // Subscribe to user status
  subscribeToUserStatus(
    userId: string,
    callback: (event: UserStatusEvent) => void
  ) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      return null;
    }

    const subscription = this.client.subscribe(
      `/topic/status/${userId}`,
      (message) => {
        try {
          const event: UserStatusEvent = JSON.parse(message.body);
          callback(event);
        } catch (error) {
          console.error("[WebSocket] Error parsing status event:", error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  // Send message via WebSocket
  sendMessage(message: WebSocketMessage) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      throw new Error("WebSocket not connected");
    }

    this.client.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(message),
    });
  }

  // Send typing indicator
  sendTypingIndicator(chatRoomId: string, isTyping: boolean) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      return;
    }

    this.client.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({ chatRoomId, isTyping }),
    });
  }

  // Send read receipt
  sendReadReceipt(messageId: string, userId: string) {
    if (!this.client?.connected) {
      console.error("[WebSocket] Not connected");
      return;
    }

    this.client.publish({
      destination: "/app/chat.receipt",
      body: JSON.stringify({ messageId, userId }),
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
