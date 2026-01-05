"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Check } from 'lucide-react';

import type { Notification } from '@/types/notification';
import { NotificationItem } from '@/components/notification/NotificationItem';
import { notificationService } from '@/lib/api/notificationService';
import { useNotification } from '@/context/NotificationContext';

export default function NotificationPage() {

    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const { refreshNotifications } = useNotification();

    React.useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await notificationService.getNotifications(0, 50); // Load more for the full page
            setNotifications(data.content);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const unreadNotifications = React.useMemo(() => {
        return notifications.filter((n) => !n.isRead);
    }, [notifications]);

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            refreshNotifications();
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleItemClick = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            refreshNotifications();
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const renderList = (list: Notification[]) => {
        if (list.length === 0) {
            return (
                <div className="flex h-full flex-col items-center justify-center p-10 text-sm text-muted-foreground">
                    <Bell className="h-10 w-10 opacity-50 mb-3" />
                    <p>Không có thông báo nào.</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col">
                {list.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <NotificationItem notification={item} onClick={() => handleItemClick(item.id)} />
                        {index < list.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        
        <Card className="max-w-3xl mx-auto shadow-md flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle>Thông báo</CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadNotifications.length === 0}
                >
                    <Check className="w-4 h-4 mr-1.5" />
                    Đánh dấu tất cả đã đọc
                </Button>
            </CardHeader>

            
            <CardContent className="p-0 flex-1">
                
                <Tabs defaultValue="all" className="flex flex-col h-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="unread">
                            Chưa đọc
                            {unreadNotifications.length > 0 && (
                                <Badge variant="default" className="ml-2 rounded-full px-2">
                                    {unreadNotifications.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="p-0">
                        {renderList(notifications)}
                    </TabsContent>
                    <TabsContent value="unread" className="p-0">
                        {renderList(unreadNotifications)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}