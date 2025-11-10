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
import { mockNotifications } from '@/lib/mockData';

export default function NotificationPage() {

    const [notifications, setNotifications] = React.useState(mockNotifications);

    const unreadNotifications = React.useMemo(() => {
        return notifications.filter((n) => !n.read);
    }, [notifications]);

    const handleMarkAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleItemClick = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const renderList = (list: Notification[]) => {
        if (list.length === 0) {
            return (
                // THAY ĐỔI 1: Thêm "h-full" để div này lấp đầy TabsContent
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
        // THAY ĐỔI 2: Thêm "flex-1 flex flex-col" để Card lấp đầy layout
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

            {/* THAY ĐỔI 3: Thêm "flex-1" để CardContent lấp đầy Card */}
            <CardContent className="p-0 flex-1">
                {/* THAY ĐỔI 4: Thêm "flex-1" để Tabs lấp đầy CardContent */}
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

                    {/* TabsContent đã có "flex-1" từ component gốc */}
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