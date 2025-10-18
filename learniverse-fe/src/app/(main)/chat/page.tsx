'use client';

import React, { useMemo, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import WelcomeScreen from '@/components/chat/WellcomeScreen';
import { chatReducer } from './state/chatReducer';
import { initialState, mockUser } from '@/lib/mockData';

export default function ChatPage() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { chats, messages, currentChatId, searchQuery } = state;

  const filteredChats = useMemo(
    () => chats.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [chats, searchQuery]
  );

  const currentChat = useMemo(
    () => chats.find((c) => c.id === currentChatId) || null,
    [chats, currentChatId]
  );

  const handleSelect = (id: string) => dispatch({ type: 'SELECT_CHAT', payload: id });
  const handleSearch = (q: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: q });
  const handleSend = (chatId: string, msg: { content: string; senderId: string; createdAt: string }) => {
    const messageWithId = { id: `msg_${Date.now()}`, ...msg };
    dispatch({ type: 'SEND_MESSAGE', payload: { chatId, message: messageWithId } });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex border rounded-lg shadow-sm overflow-hidden">
      {/* Left panel */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Tin nhắn</h1>
            <Button size="icon" variant="ghost">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ChatList chats={filteredChats} currentChatId={currentChatId} onSelect={handleSelect} />
      </div>

      {/* Main panel */}
      {currentChat ? (
        <ChatWindow chat={currentChat} messages={messages[currentChat.id] || []} userId={mockUser.id} onSend={handleSend} />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}
