import React from 'react';
import ChatListItem from './ChatListItem';
import type { Chat } from '@/types/chat';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Props {
  chats: Chat[];
  currentChatId: string | null;
  onSelect: (id: string) => void;
}

const ChatList = ({ chats, currentChatId, onSelect }: Props) => {
  return (
    <div className="overflow-y-auto flex-1">
      {chats.length > 0 ? (
        chats.map((chat) => (
          <ChatListItem key={chat.id} chat={chat} isSelected={chat.id === currentChatId} onSelect={onSelect} />
        ))
      ) : (
        <div className="p-4 text-center text-muted-foreground mt-8">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Không tìm thấy cuộc trò chuyện nào.</p>
        </div>
      )}
    </div>
  );
};

export default ChatList;
