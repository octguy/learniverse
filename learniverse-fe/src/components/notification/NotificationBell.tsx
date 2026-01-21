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
import { notificationService } from '@/lib/api/notificationService';
import { commentService } from '@/lib/api/commentService';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const { unreadNotificationsCount, refreshNotifications } = useNotification();
    const [isOpen, setIsOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        try {
            const data = await notificationService.getNotifications(0, 20);
            setNotifications(data.content);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const handleNotificationClick = async (item: Notification) => {
        try {
            if (!item.isRead) {
                await notificationService.markAsRead(item.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
                refreshNotifications();
            }

            if (["COMMENT", "REPLY", "MENTION"].includes(item.notificationType as string)) {
                setIsOpen(false);
                try {
                    const comment = await commentService.getCommentById(item.relatedEntityId);
                    if (comment && comment.commentableId) {
                        router.push(`/posts/${comment.commentableId}`);
                    } else {
                        router.push(`/posts/${item.relatedEntityId}`);
                    }
                } catch (err) {
                    console.error("Failed to fetch comment details", err);
                    router.push(`/posts/${item.relatedEntityId}`);
                }
            } else if (["LIKE", "POST_SHARE", "ANSWER", "ANSWER_ACCEPTED"].includes(item.notificationType as string)) {
                setIsOpen(false);
                router.push(`/posts/${item.relatedEntityId}`);
            } else if (item.notificationType === "FRIEND_REQUEST" || item.notificationType === "FRIEND_ACCEPT") {
                setIsOpen(false);
                router.push(`/profile/${item.senderId}`);
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            refreshNotifications();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex flex-col items-center text-gray-600 hover:text-primary cursor-pointer">
                    <div className="relative">
                        <Bell className="w-5 h-5" />
                        {unreadNotificationsCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                            </span>
                        )}
                    </div>
                    <span className="text-xs">Thông báo</span>
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
                        disabled={unreadNotificationsCount === 0}
                    >
                        <Check className="w-4 h-4 mr-1.5" />
                        Đánh dấu đã đọc
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <NotificationList
                        notifications={notifications}
                        onItemClick={handleNotificationClick}
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