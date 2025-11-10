import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Chat } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Props {
  chat: Chat;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ChatListItem = ({ chat, isSelected, onSelect }: Props) => {
  return (
    <div
      onClick={() => onSelect(chat.id)}
      className={`p-3 border-b cursor-pointer hover:bg-gray-100 flex items-center space-x-3 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={chat.avatar || undefined} />
        <AvatarFallback>{chat.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <h3 className="font-medium truncate text-sm">{chat.name}</h3>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { locale: vi })}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate">{chat.lastMessage.content}</p>
          {chat.unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatListItem);
