"use client"

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, HomeIcon, Search, MessageCircle, Users, Settings, LogOut, Home, LayoutGrid, BadgeQuestionMark, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { questionService } from '@/lib/api/questionService';
import type { QuestionSummary } from '@/types/question';

export function Header() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { unreadMessagesCount, pendingFriendRequestsCount, unreadNotificationsCount } = useNotification();
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QuestionSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await questionService.list({ 
          query: searchQuery.trim(),
          size: 5
        });
        setSearchResults(data?.content ?? []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle enter to go to search results page
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = (slug: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/questions/${slug}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2 sticky top-0 z-50">
      <div className="flex items-center gap-x-20 max-w-7xl mx-auto">
        {/* Logo + Search */}
        <div className="flex items-center space-x-2 ">
          {/* Logo và menu mobile */}
          <div className="flex items-center gap-3">
            {/* Nút menu mobile */}
            <button className="lg:hidden p-2 rounded-md hover:bg-gray-100">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-lg font-bold text-primary hidden sm:block">
                Learniverse
              </span>
            </Link>
          </div>

          {/* Search bar with dropdown */}
          <div className="hidden md:flex w-[450px] mx-5" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              )}
              <Input 
                ref={inputRef}
                type="text" 
                placeholder="Tìm kiếm câu hỏi, bài viết..."
                className="pl-10 pr-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowDropdown(true)}
              />
              
              {/* Search dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border shadow-lg overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="p-2 text-xs text-muted-foreground border-b">
                        Câu hỏi liên quan
                      </div>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleResultClick(result.slug)}
                          className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm font-medium line-clamp-1">{result.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {result.answerCount ?? 0} câu trả lời · {result.viewCount ?? 0} lượt xem
                          </p>
                        </button>
                      ))}
                      <button
                        type="submit"
                        className="w-full px-3 py-2 text-sm text-primary font-medium hover:bg-primary/5 border-t flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Xem tất cả kết quả cho &quot;{searchQuery}&quot;
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      {isSearching ? 'Đang tìm kiếm...' : 'Không tìm thấy kết quả'}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="flex items-center justify-end space-x-7">
          <Link href="/home" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/friend" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <div className="relative">
              <Users className="w-5 h-5" />
              {pendingFriendRequestsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {pendingFriendRequestsCount > 9 ? "9+" : pendingFriendRequestsCount}
                </span>
              )}
            </div>
            <span className="text-xs">Network</span>
          </Link>
          <Link href="/questions" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <BadgeQuestionMark className="w-5 h-5" />
            <span className="text-xs">Question</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-xs">Chat</span>
          </Link>
          <NotificationBell />

          {loading ? (
            <div className="flex flex-col items-center text-gray-600 cursor-wait">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-3 w-6 mt-1.5" />
            </div>
          ) : user ? (
            <Link href="/profile" className="flex flex-col items-center text-gray-600 hover:text-primary">
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs">Me</span>
            </Link>
          ) : (
            <Link href="/login" className="flex flex-col items-center text-gray-600 hover:text-primary">
              <Avatar className="w-6 h-6">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <span className="text-xs">Login</span>
            </Link>
          )}

          {/* Work menu */}
          <div className="flex flex-col items-center text-gray-600 hover:text-primary">
            <LayoutGrid className="w-5 h-5" />
            <span className="text-xs">Work</span>
          </div>
        </div>
      </div>
    </header>
  );
}