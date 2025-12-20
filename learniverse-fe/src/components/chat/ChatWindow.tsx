import React, { useEffect, useRef, useState } from "react";
import type { Chat, Message } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";

interface Props {
  chat: Chat;
  messages: Message[];
  userId: string;
  onSend: (chatId: string, textContent: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}

const ChatWindow = ({
  chat,
  messages,
  userId,
  onSend,
  onLoadMore,
  hasMore,
  loadingMore,
}: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const previousScrollHeightRef = useRef(0);
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const loadMoreThrottleRef = useRef(false);
  const wasLoadingMoreRef = useRef(false);
  const oldestMessageIdRef = useRef<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

  // Delay showing spinner to prevent flash
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loadingMore) {
      timer = setTimeout(() => {
        setShowLoadingSpinner(true);
      }, 1000); // 1 second delay
    } else {
      setShowLoadingSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [loadingMore]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        isInitialLoadRef.current = false;
        setInitialLoading(false);
      });
    }
  }, [messages.length]);

  // Reset initial load flag when chat changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    setInitialLoading(true);
    previousMessageCountRef.current = 0;
  }, [chat.id]);

  // Auto-scroll to bottom only for NEW messages (not when loading old messages)
  useEffect(() => {
    const countIncreased = messages.length > previousMessageCountRef.current;
    const justFinishedLoadingMore = wasLoadingMoreRef.current && !loadingMore;

    if (
      countIncreased &&
      !isInitialLoadRef.current &&
      !justFinishedLoadingMore // Don't auto-scroll when we just loaded old messages
    ) {
      // New message added at the bottom
      if (autoScroll) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    previousMessageCountRef.current = messages.length;
    wasLoadingMoreRef.current = loadingMore;
  }, [messages.length, autoScroll, loadingMore]);

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (loadingMore && messagesContainerRef.current) {
      previousScrollHeightRef.current =
        messagesContainerRef.current.scrollHeight;
      // Save the ID of the oldest message (first in array)
      if (messages.length > 0) {
        oldestMessageIdRef.current = messages[0].id;
      }
    }
  }, [loadingMore, messages]);

  // Restore scroll position after prepending messages
  useEffect(() => {
    if (
      !loadingMore &&
      messagesContainerRef.current &&
      oldestMessageIdRef.current
    ) {
      // Use requestAnimationFrame to ensure smooth restoration
      requestAnimationFrame(() => {
        const oldestMessageElement = document.getElementById(
          `msg-${oldestMessageIdRef.current}`
        );
        if (oldestMessageElement) {
          // Use scrollIntoView with nearest to prevent jumping
          oldestMessageElement.scrollIntoView({
            block: "nearest",
            behavior: "instant",
          });
        }
        oldestMessageIdRef.current = null;
      });
    }
  }, [loadingMore, messages]);

  // Handle scroll events
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);

    // Load more when scrolled to top
    const isAtTop = scrollTop < 100;

    // Throttle to prevent multiple calls
    if (isAtTop && hasMore && !loadingMore && !loadMoreThrottleRef.current) {
      console.log("[CHAT] ⬆️ Loading more messages (reached top)...");
      loadMoreThrottleRef.current = true;
      onLoadMore();

      // Reset throttle after 1 second
      setTimeout(() => {
        loadMoreThrottleRef.current = false;
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content) return;
    onSend(chat.id, content);
    setMessageInput("");
    // Force scroll to bottom when sending a message
    setAutoScroll(true);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
  const fmtDate = (d: Date) => format(d, "MMM d").toUpperCase(); // OCT 4
  const full = (iso: string) => format(new Date(iso), "HH:mm • dd/MM/yyyy");

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full max-h-full">
      <div className="p-3 border-b bg-white flex items-center shadow-sm flex-shrink-0">
        <Avatar className="w-10 h-10 mr-3">
          <AvatarImage src={chat.avatar || undefined} />
          <AvatarFallback>{chat.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-gray-800">{chat.name}</h2>
          {chat.isGroupChat && (
            <p className="text-xs text-gray-500">
              {chat.participants.length} thành viên
            </p>
          )}
        </div>
      </div>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
        style={{ opacity: initialLoading ? 0 : 1, transition: "opacity 0.15s" }}
      >
        {showLoadingSpinner && (
          <div className="flex justify-center py-3 sticky top-0 bg-gray-50 z-10">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Đang tải tin nhắn cũ...</span>
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const showDate =
              !prev ||
              !isSameDay(new Date(prev.createdAt), new Date(m.createdAt));
            const isOwn = m.senderId === userId;

            return (
              <React.Fragment key={m.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-2">
                    <span className="text-[11px] font-semibold text-gray-500 tracking-widest">
                      {fmtDate(new Date(m.createdAt))}
                    </span>
                  </div>
                )}

                <div
                  id={`msg-${m.id}`}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {!isOwn && (
                      <span className="text-xs text-gray-600 mb-1 ml-2">
                        {m.senderUsername}
                      </span>
                    )}
                    <div
                      className={`max-w-[70%] min-w-[100px] rounded-lg px-3 py-2 ${
                        isOwn ? "bg-blue-500 text-white" : "bg-white border"
                      }`}
                      title={full(m.createdAt)}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {m.textContent}
                      </p>
                      <div
                        className={`mt-1 text-[10px] leading-none text-right ${
                          isOwn ? "opacity-80" : "text-muted-foreground"
                        }`}
                      >
                        {fmtTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-white flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" disabled={!messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
