"use client";

import * as React from 'react';
import { Bell, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationList } from './NotificationList';
import type { Notification } from '@/types/notification';
import Link from 'next/link';
import { mockNotifications } from '@/lib/mockData'; // <-- ĐÃ IMPORT TỪ ĐÂY

export function NotificationBell() {
    // mock data
    const [notifications, setNotifications] = React.useState(mockNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleMarkAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const handleMarkAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex flex-col items-center text-gray-600 hover:text-primary relative cursor-pointer">
                    <Bell className="w-5 h-5" />
                    <span className="text-xs">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 h-[450px] flex flex-col" align="end">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="text-lg font-semibold">Thông báo</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                    >
                        <Check className="w-4 h-4 mr-1.5" />
                        Đánh dấu đã đọc
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <NotificationList
                        notifications={notifications}
                        onItemClick={handleMarkAsRead}
                    />
                </div>

                {/* Footer */}
                <div className="p-2 text-center border-t bg-gray-50 dark:bg-gray-800">
                    <Button variant="link" size="sm" className="text-sm w-full" asChild>
                        <Link href="/notifications">Xem tất cả thông báo</Link>
                    </Button>
                </div>
            </PopoverContent>

        </Popover>
    );
}