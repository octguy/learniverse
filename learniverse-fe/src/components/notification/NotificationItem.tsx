"use client";

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
    notification: Notification;
    onClick?: (id: string) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
    return (
        <div
            className={cn(
                'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-accent',
                !notification.read && 'bg-blue-50 dark:bg-blue-900/20'
            )}
            onClick={() => onClick?.(notification.id)}
        >
            <Avatar className="h-9 w-9">
                <AvatarImage src={notification.avatarUrl} alt="Avatar" />
                <AvatarFallback>
                    {notification.text.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <p className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: notification.text }} />
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                        locale: vi,
                        addSuffix: true,
                    })}
                </p>
            </div>

            {!notification.read && (
                <div className="h-2.5 w-2.5 self-center rounded-full bg-blue-500" />
            )}
        </div>
    );
}