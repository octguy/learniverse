import React from 'react';
import ChatListItem from './ChatListItem';
import type { Chat } from '@/types/chat';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SuggestedFriend } from "@/types/friend";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  chats: Chat[];
  friends?: SuggestedFriend[];
  currentChatId: string | null;
  onSelect: (id: string) => void;
  onSelectFriend?: (id: string) => void;
}

const ChatList = ({ chats, friends, currentChatId, onSelect, onSelectFriend }: Props) => {
  const hasChats = chats.length > 0;
  const hasFriends = friends && friends.length > 0;

  if (!hasChats && !hasFriends) {
    return (
        <div className="overflow-y-auto flex-1">
            <div className="p-4 text-center text-muted-foreground mt-8">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Không tìm thấy cuộc trò chuyện nào.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {hasChats && (
        <>
            {hasFriends && <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-gray-50">Trò chuyện</div>}
            {chats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} isSelected={chat.id === currentChatId} onSelect={onSelect} />
            ))}
        </>
      )}

      {hasFriends && (
        <>
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-gray-50">Người liên hệ</div>
            {friends.map((friend) => (
                <div
                    key={friend.id}
                    className="p-3 border-b cursor-pointer hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                    onClick={() => onSelectFriend?.(friend.userId)}
                >
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.avatarUrl || undefined} />
                        <AvatarFallback>{friend.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-sm">{friend.displayName}</h3>
                        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                    </div>
                </div>
            ))}
        </>
      )}
    </div>
  );
};

export default ChatList;
