"use client";

import React from "react";

interface ParentMessageProps {
  senderUsername: string;
  textContent: string;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  onClick?: () => void;
}

export default function ParentMessage({
  senderUsername,
  textContent,
  messageType,
  onClick,
}: ParentMessageProps) {
  const renderContent = () => {
    if (messageType === "TEXT") {
      return (
        <p className="text-xs truncate opacity-90">
          {textContent}
        </p>
      );
    } else if (messageType === "IMAGE") {
      return <p className="text-xs opacity-90">📷 Image</p>;
    } else if (messageType === "VIDEO") {
      return <p className="text-xs opacity-90">🎥 Video</p>;
    } else if (messageType === "FILE") {
      return <p className="text-xs opacity-90">📎 File</p>;
    }
  };

  return (
    <div 
      className={`border-l-2 border-current pl-2 mb-2 opacity-80 ${onClick ? 'cursor-pointer hover:opacity-100 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs font-semibold opacity-90">{senderUsername}</p>
      {renderContent()}
    </div>
  );
}
