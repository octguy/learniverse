"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, HomeIcon, Search, MessageCircle, Users, Settings, LogOut, Home, LayoutGrid, BadgeQuestionMark } from 'lucide-react';

const sampleUser = {
  displayName: 'test-user',
  avatar: 'https://github.com/shadcn.png',
};

const unreadCount = 5;

export function Header() {
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
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-lg font-bold text-primary hidden sm:block">
                Learniverse
              </span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex w-[450px] mx-5">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input type="text" placeholder="Tìm kiếm bài viết, người dùng, nhóm..."
                className="pl-10 w-full" />
            </div>
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="flex items-center justify-end space-x-7">
          <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/network" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <Users className="w-5 h-5" />
            <span className="text-xs">Network</span>
          </Link>
          <Link href="/jobs" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <BadgeQuestionMark className="w-5 h-5" />
            <span className="text-xs">Question</span>
          </Link>
          <Link href="/chat" className="flex flex-col items-center text-gray-600 hover:text-primary relative">
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/notifications" className="flex flex-col items-center text-gray-600 hover:text-primary">
            <Bell className="w-5 h-5" />
            <span className="text-xs">Notifications</span>
          </Link>

          {/* Profile */}
          <div className="flex flex-col items-center text-gray-600 hover:text-primary">
            <Avatar className="w-6 h-6">
              <AvatarImage src={sampleUser.avatar} alt={sampleUser.displayName} />
              <AvatarFallback>{sampleUser.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs">Me</span>
          </div>

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