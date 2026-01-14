"use client";

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
    notification: Notification;
    onClick?: (notification: Notification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
    return (
        <div
            className={cn(
                'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-accent',
                !notification.isRead && 'bg-blue-50 dark:bg-blue-900/20'
            )}
            onClick={() => onClick?.(notification)}
        >
            <Avatar className="h-9 w-9">
                <AvatarImage src={notification.senderAvatarUrl || undefined} alt="Avatar" />
                <AvatarFallback>
                    {notification.senderName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold">{notification.senderName}</p>
                <div 
                    className="text-sm leading-snug whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: notification.content }} 
                />
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                        locale: vi,
                        addSuffix: true,
                    })}
                </p>
            </div>

            {!notification.isRead && (
                <div className="h-2.5 w-2.5 self-center rounded-full bg-blue-500" />
            )}
        </div>
    );
}