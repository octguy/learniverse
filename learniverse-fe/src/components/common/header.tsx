"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, HomeIcon, Search, MessageCircle, Users, Settings, LogOut, Home, LayoutGrid, BadgeQuestionMark, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notification/NotificationBell';


import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { friendService } from '@/lib/api/friendService';
import { SuggestedFriend } from '@/types/friend';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, loading, logout } = useAuth();
  const { unreadMessagesCount, pendingFriendRequestsCount, unreadNotificationsCount } = useNotification();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SuggestedFriend[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchFriends = async () => {
      if (debouncedSearchTerm.trim()) {
        try {
          const response = await friendService.searchFriends(debouncedSearchTerm);
          const data = response.data || response;
          // Handle both array directly or wrapped in data field just in case
          const results = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

          const uniqueResults = Array.from(new Map(results.map((item: SuggestedFriend) => [item.id, item])).values());

          setSearchResults(uniqueResults);
          if (results.length > 0) setShowResults(true);
        } catch (error) {
          console.error("Search failed", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    };
    searchFriends();
  }, [debouncedSearchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowResults(false);
      if (searchQuery.trim()) {
        router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      }
    }
  }

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

          {/* Search bar */}
          <div className="hidden md:flex w-[450px] mx-5 relative" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm bài viết, người dùng, nhóm..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
              />
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-2 py-2 z-50 max-h-80 overflow-y-auto">
                {searchResults.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowResults(false);
                      router.push(`/profile/${friend.userId || friend.id}`);
                    }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={friend.avatarUrl || ''} />
                      <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{friend.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex flex-col items-center text-gray-600 hover:text-primary cursor-pointer">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">Me</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {(user?.role === 'ROLE_ADMIN' || user?.roles?.includes('ROLE_ADMIN')) && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer w-full flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Quản trị
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer w-full flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/drafts" className="cursor-pointer w-full flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Bài viết nháp
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer w-full flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 cursor-pointer focus:text-red-500"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="flex flex-col items-center text-gray-600 hover:text-primary">
              <Avatar className="w-6 h-6">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <span className="text-xs">Login</span>
            </Link>
          )}
        </div>
      </div>
    </header >
  );
}