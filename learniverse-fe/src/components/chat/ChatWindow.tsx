import React, { useEffect, useRef, useState } from "react";
import type { Chat, Message } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format, isSameDay } from "date-fns";

interface Props {
  chat: Chat;
  messages: Message[];
  userId: string;
  onSend: (chatId: string, textContent: string) => void;
}

const ChatWindow = ({ chat, messages, userId, onSend }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content) return;
    onSend(chat.id, content);
    setMessageInput("");
  };

  const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
  const fmtDate = (d: Date) => format(d, "MMM d").toUpperCase(); // OCT 4
  const full = (iso: string) => format(new Date(iso), "HH:mm • dd/MM/yyyy");

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="p-3 border-b bg-white flex items-center shadow-sm">
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
      <div className="p-4 border-t bg-white">
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
