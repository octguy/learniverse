"use client";

import * as React from 'react';
import type { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';

interface NotificationListProps {
    notifications: Notification[];
    onItemClick: (id: string) => void;
}

export function NotificationList({ notifications, onItemClick }: NotificationListProps) {
    if (notifications.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-6 text-sm text-muted-foreground">
                <Bell className="h-8 w-8 opacity-50 mb-2" />
                <p>Không có thông báo mới.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full w-full">
            <div className="flex flex-col">
                {notifications.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <NotificationItem notification={item} onClick={onItemClick} />
                        {index < notifications.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
            </div>
        </ScrollArea>
    );
}