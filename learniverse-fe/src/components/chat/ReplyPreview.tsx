"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/types/chat";

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

export default function ReplyPreview({ message, onCancel }: ReplyPreviewProps) {
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getPreviewText = () => {
    if (message.messageType === "IMAGE") return "🖼️ Image";
    if (message.messageType === "VIDEO") return "🎥 Video";
    if (message.messageType === "FILE") return `📄 ${message.textContent}`;
    return truncateText(message.textContent);
  };

  return (
    <div className="px-4 py-2 bg-blue-50 border-l-4 border-blue-500 flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-900">
          Replying to {message.senderUsername}
        </p>
        <p className="text-xs text-blue-700 truncate">{getPreviewText()}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onCancel}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
