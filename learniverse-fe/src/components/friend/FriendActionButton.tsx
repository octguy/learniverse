"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, UserCheck, X, Clock } from 'lucide-react';
import { friendService } from '@/lib/api/friendService';
import { FriendStatus } from '@/types/friend';
import { toast } from 'sonner';

interface FriendActionButtonProps {
    userId: string;
    initialStatus?: FriendStatus;
    onStatusChange?: (newStatus: FriendStatus) => void;
}

export function FriendActionButton({ userId, initialStatus, onStatusChange }: FriendActionButtonProps) {
    const [status, setStatus] = React.useState<FriendStatus>(initialStatus || FriendStatus.NONE);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!initialStatus) {
            const fetchStatus = async () => {
                try {
                    const res = await friendService.getFriendStatus(userId);
                    setStatus(res.data.data);
                } catch (error) {
                    console.error("Failed to fetch friend status", error);
                }
            };
            fetchStatus();
        } else {
            setStatus(initialStatus);
        }
    }, [userId, initialStatus]);

    const handleAction = async (action: () => Promise<any>, newStatus: FriendStatus, successMessage: string) => {
        try {
            setLoading(true);
            await action();
            setStatus(newStatus);
            toast.success(successMessage);
            onStatusChange?.(newStatus);
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Button disabled variant="ghost" size="sm">Checking...</Button>;
    }

    switch (status) {
        case FriendStatus.ACCEPTED:
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => handleAction(() => friendService.unfriend(userId), FriendStatus.NONE, "Đã hủy kết bạn")}
                >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Hủy kết bạn
                </Button>
            );

        case FriendStatus.PENDING:
            return (
                 <Button
                    variant="secondary"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => handleAction(() => friendService.cancelRequest(userId), FriendStatus.NONE, "Đã hủy lời mời")}
                >
                    <Clock className="w-4 h-4 mr-2" />
                    Đã gửi lời mời
                </Button>
            );
        default: 
            return (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAction(() => friendService.sendRequest(userId), FriendStatus.PENDING, "Đã gửi lời mời kết bạn")}
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Kết bạn
                </Button>
            );
    }
}