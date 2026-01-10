import React, { useEffect, useRef, useState } from "react";
import type { Chat, Message } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Paperclip,
  Reply,
  UserPlus,
  Info,
  Pencil,
  X,
  MoreVertical,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { chatService } from "@/lib/api/chatService";
import { uploadFile } from "@/lib/api/fileUploadService";
import FilePreview from "./FilePreview";
import MessageAttachment from "./MessageAttachment";
import ReplyPreview from "./ReplyPreview";
import ParentMessage from "./ParentMessage";
import { AddMemberModal } from "./AddMemberModal";
import { GroupInfoModal } from "./GroupInfoModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Props {
  chat: Chat;
  messages: Message[];
  userId: string;
  onSend: (chatId: string, content: string, parentMessageId?: string) => void;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"IMAGE" | "VIDEO" | "FILE" | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // Mark messages as read when chat is opened
  useEffect(() => {
    const markRead = async () => {
      try {
        await chatService.markAsRead(chat.id);
        console.log("[CHAT] ✅ Marked messages as read for chat:", chat.id);
      } catch (error) {
        console.error("[CHAT] ❌ Error marking as read:", error);
      }
    };
    markRead();
  }, [chat.id]);

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


  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
        isInitialLoadRef.current = false;
        setInitialLoading(false);
      });
    } else if (isInitialLoadRef.current && messages.length === 0) {
      // If there are no messages, still show the chat window
      setInitialLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [messages.length, messages]);

  // Reset initial load flag when chat changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    setInitialLoading(true);
    previousMessageCountRef.current = 0;
    oldestMessageIdRef.current = null;
    setAutoScroll(true);
    setReplyingTo(null);
    setEditingMessage(null);
    setMessageInput("");
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  const handleEditMessage = async (content: string) => {
    if (!editingMessage) return;
    try {
      const response = await chatService.editMessage({
        messageId: editingMessage.id,
        textContent: content
      });
      if (response.data.status === "success") {
        setEditingMessage(null);
        setMessageInput("");
      }
    } catch (error) {
      console.error("Failed to edit message", error);
      toast.error("Không thể chỉnh sửa tin nhắn");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content) return;

    if (editingMessage) {
      handleEditMessage(content);
      return;
    }

    // Send with parentMessageId if replying
    if (replyingTo) {
      onSend(chat.id, content, replyingTo.id);
      setReplyingTo(null);
    } else {
      onSend(chat.id, content);
    }

    setMessageInput("");
    // Force scroll to bottom when sending a message
    setAutoScroll(true);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setMessageInput(message.textContent);
    setReplyingTo(null); // Cancel reply if any
    fileInputRef.current && (fileInputRef.current.value = ""); // Clear file input
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setMessageInput("");
  };

  const detectFileType = (file: File): "IMAGE" | "VIDEO" | "FILE" => {
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (imageTypes.includes(file.type)) return "IMAGE";
    if (videoTypes.includes(file.type)) return "VIDEO";
    return "FILE";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("[FILE] Selected file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      const detectedType = detectFileType(file);
      console.log("[FILE] Detected type:", detectedType);

      setSelectedFile(file);
      setFileType(detectedType);
    }
  };

  // Scroll to a specific message
  const scrollToMessage = (messageId: number | string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a highlight effect
      element.classList.add("bg-yellow-100");
      setTimeout(() => {
        element.classList.remove("bg-yellow-100");
      }, 2000);
    }
  };

  const handleFileSend = async () => {
    if (!selectedFile || !fileType) return;

    // Use original filename
    const finalCaption = selectedFile.name;

    console.log("[FILE] Starting upload:", {
      fileName: selectedFile.name,
      fileType: fileType,
      fileSize: selectedFile.size,
      caption: finalCaption,
    });

    setUploading(true);
    try {
      const result = await uploadFile(
        chat.id,
        fileType,
        selectedFile,
        finalCaption,
        undefined,
        (progress) => {
          console.log("[FILE] Upload progress:", progress + "%");
          setUploadProgress(progress);
        }
      );

      console.log("[FILE] ✅ Upload successful:", result);

      // Close preview
      setSelectedFile(null);
      setFileType(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error("[FILE] ❌ Upload failed:", error);
      console.error("[FILE] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(
        `Failed to upload file: ${error.response?.data?.message || error.message
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileCancel = () => {
    setSelectedFile(null);
    setFileType(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
  const fmtDate = (d: Date) => format(d, "MMM d, yyyy").toUpperCase(); // OCT 4, 2025
  const full = (iso: string) => format(new Date(iso), "HH:mm • dd/MM/yyyy");

  return (
    <div className="flex-1 w-full min-w-0 min-h-0 flex flex-col bg-gray-50 h-full max-h-full">
      <div className="p-3 border-b bg-white flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center">
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
        <div className="flex items-center gap-1">
          {chat.isGroupChat && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddMemberOpen(true)}
                title="Thêm thành viên"
              >
                <UserPlus className="w-5 h-5 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsGroupInfoOpen(true)}
                title="Thông tin nhóm"
              >
                <Info className="w-5 h-5 text-gray-500" />
              </Button>
            </>
          )}
        </div>
      </div>

      <AddMemberModal
        chatId={chat.id}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onMemberAdded={() => {
          // Ideally refresh chat details here, but for now just close
          // You might want to trigger a reload of participants or chat info
        }}
      />
      <GroupInfoModal
        chatId={chat.id}
        chatName={chat.name}
        open={isGroupInfoOpen}
        onOpenChange={setIsGroupInfoOpen}
        currentUserId={userId}
        onLeaveGroup={() => {
          window.location.reload();
        }}
      />

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
            // Show avatar if it's not own message and either first message or different sender from previous
            const showAvatar =
              !isOwn && (!prev || prev.senderId !== m.senderId);

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
                  id={`message-${m.id}`}
                  className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"
                    }`}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={m.senderAvatar || undefined} />
                          <AvatarFallback className="text-xs bg-gray-200">
                            {m.senderUsername.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  )}
                  <div
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"
                      }`}
                  >
                    {!isOwn && showAvatar && (
                      <span className="text-xs text-gray-600 mb-1 ml-2">
                        {m.senderUsername}
                      </span>
                    )}
                    <div className="group relative flex items-center">
                      {isOwn && m.messageType === "TEXT" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                              <MoreVertical className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEditing(m)}>
                              <Pencil className="w-3 h-3 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {/* Different styling for media vs text messages */}
                      {m.messageType === "TEXT" ? (
                        <div
                          className={`flex items-end gap-1 ${isOwn ? "justify-end" : "justify-start"
                            }`}
                        >
                          {/* Reply button on LEFT for own text messages */}
                          {isOwn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex-shrink-0 mb-1"
                              onClick={() => setReplyingTo(m)}
                            >
                              <Reply className="w-3 h-3" />
                            </Button>
                          )}

                          <div
                            className={`max-w-[100%] min-w-[100px] rounded-lg px-3 py-2 ${isOwn
                              ? "bg-blue-500 text-white"
                              : "bg-white border"
                              }`}
                            title={full(m.createdAt)}
                          >
                            {/* Parent Message Reference */}
                            {m.parentMessageId && (
                              <ParentMessage
                                senderUsername={
                                  messages.find(
                                    (msg) => msg.id === m.parentMessageId
                                  )?.senderUsername || "Unknown"
                                }
                                textContent={
                                  messages.find(
                                    (msg) => msg.id === m.parentMessageId
                                  )?.textContent || ""
                                }
                                messageType={
                                  (messages.find(
                                    (msg) => msg.id === m.parentMessageId
                                  )?.messageType as
                                    | "TEXT"
                                    | "IMAGE"
                                    | "VIDEO"
                                    | "FILE") || "TEXT"
                                }
                                onClick={() =>
                                  scrollToMessage(m.parentMessageId!)
                                }
                              />
                            )}

                            <MessageAttachment
                              messageType={
                                m.messageType as
                                | "TEXT"
                                | "IMAGE"
                                | "VIDEO"
                                | "FILE"
                              }
                              metadata={m.metadata}
                              textContent={m.textContent}
                            />
                            <div
                              className={`mt-1 text-[10px] leading-none text-right ${isOwn ? "opacity-80" : "text-muted-foreground"
                                }`}
                            >
                              {fmtTime(m.createdAt)}
                            </div>
                          </div>

                          {/* Reply button on RIGHT for others' text messages */}
                          {!isOwn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex-shrink-0 mb-1"
                              onClick={() => setReplyingTo(m)}
                            >
                              <Reply className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`flex ${isOwn ? "justify-end" : "justify-start"
                            }`}
                        >
                          <div className="relative inline-block max-w-[100%]">
                            {/* Parent Message Reference for media */}
                            {m.parentMessageId && (
                              <div
                                className={`mb-2 px-3 py-2 rounded-lg ${isOwn
                                  ? "bg-blue-500 text-white"
                                  : "bg-white border"
                                  }`}
                              >
                                <ParentMessage
                                  senderUsername={
                                    messages.find(
                                      (msg) => msg.id === m.parentMessageId
                                    )?.senderUsername || "Unknown"
                                  }
                                  textContent={
                                    messages.find(
                                      (msg) => msg.id === m.parentMessageId
                                    )?.textContent || ""
                                  }
                                  messageType={
                                    (messages.find(
                                      (msg) => msg.id === m.parentMessageId
                                    )?.messageType as
                                      | "TEXT"
                                      | "IMAGE"
                                      | "VIDEO"
                                      | "FILE") || "TEXT"
                                  }
                                  onClick={() =>
                                    scrollToMessage(m.parentMessageId!)
                                  }
                                />
                              </div>
                            )}

                            <MessageAttachment
                              messageType={
                                m.messageType as
                                | "TEXT"
                                | "IMAGE"
                                | "VIDEO"
                                | "FILE"
                              }
                              metadata={m.metadata}
                              textContent={m.textContent}
                            />

                            {/* Timestamp and Reply button in same row */}
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <div
                                className={`text-[10px] leading-none ${isOwn
                                  ? "text-blue-600"
                                  : "text-muted-foreground"
                                  }`}
                              >
                                {fmtTime(m.createdAt)}
                              </div>

                              {/* Reply button aligned with timestamp */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex-shrink-0"
                                onClick={() => setReplyingTo(m)}
                              >
                                <Reply className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className="border-t bg-white flex-shrink-0">
        {replyingTo && (
          <ReplyPreview
            message={replyingTo}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        {editingMessage && (
          <div className="px-4 py-2 bg-yellow-50 border-b flex items-center justify-between">
            <div className="flex items-center text-sm text-yellow-700">
              <Pencil className="w-4 h-4 mr-2" />
              Đang chỉnh sửa tin nhắn
            </div>
            <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-6 w-6 p-0 hover:bg-yellow-200">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!!editingMessage}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={editingMessage ? "Nhập nội dung mới..." : "Nhập tin nhắn..."}
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" disabled={!messageInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && fileType && (
        <FilePreview
          file={selectedFile}
          fileType={fileType}
          onCancel={handleFileCancel}
          onSend={handleFileSend}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  );
};

export default ChatWindow;
