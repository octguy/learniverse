"use client";

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { friendService } from '@/lib/api/friendService';
import { Friend } from '@/types/friend';
import { Loader2, UserCheck, UserX, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FriendsPage() {
    return (
        <div className="container mx-auto max-w-4xl p-4">
            <Card className="min-h-[600px] flex flex-col">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Bạn Bè</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="list">Danh sách bạn bè</TabsTrigger>
                            <TabsTrigger value="requests">Lời mời kết bạn</TabsTrigger>
                            <TabsTrigger value="suggested">Gợi ý kết bạn</TabsTrigger>
                        </TabsList>

                        <TabsContent value="list">
                            <FriendList />
                        </TabsContent>

                        <TabsContent value="requests">
                            <FriendRequestList />
                        </TabsContent>

                        <TabsContent value="suggested">
                            <SuggestedFriendsList />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

function FriendList() {
    const [friends, setFriends] = React.useState<Friend[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await friendService.getFriends(0, 50);
                setFriends(res.data.data?.content || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
    }, []);

    const handleUnfriend = async (id: string) => {
        if (!confirm("Bạn có chắc muốn hủy kết bạn?")) return;
        try {
            await friendService.unfriend(id);
            setFriends(prev => prev.filter(f => f.id !== id));
            toast.success("Đã hủy kết bạn");
        } catch (error) {
            toast.error("Lỗi khi hủy kết bạn");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (friends.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Bạn chưa có người bạn nào.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(friend => (
                <div key={friend.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition">
                    <Link href={`/profile/${friend.id}`}>
                        <Avatar className="h-12 w-12 cursor-pointer">
                            <AvatarImage src={friend.avatarUrl} />
                            <AvatarFallback>{(friend.displayName || friend.fullName || friend.username)?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 overflow-hidden">
                        <Link href={`/profile/${friend.id}`} className="font-semibold hover:underline truncate block">
                            {friend.displayName || friend.fullName || friend.username}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleUnfriend(friend.id)} title="Hủy kết bạn">
                        <UserX className="h-5 w-5 text-muted-foreground hover:text-red-500" />
                    </Button>
                </div>
            ))}
        </div>
    );
}

function FriendRequestList() {
    const [requests, setRequests] = React.useState<Friend[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchRequests = async () => {
        try {
            const res = await friendService.getFriendRequests(0, 50);
            setRequests(res.data.data?.content || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRequests();
    }, []);

    const handleAccept = async (id: string) => {
        try {
            await friendService.acceptRequest(id);
            setRequests(prev => prev.filter(r => r.id !== id));
            toast.success("Đã chấp nhận lời mời");
        } catch (error) {
            toast.error("Lỗi khi chấp nhận");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await friendService.rejectRequest(id);
            setRequests(prev => prev.filter(r => r.id !== id));
            toast.success("Đã từ chối lời mời");
        } catch (error) {
            toast.error("Lỗi khi từ chối");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (requests.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Không có lời mời kết bạn nào.</div>;
    }

    return (
        <div className="space-y-4">
            {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                        <Link href={`/profile/${req.id}`}>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={req.avatarUrl} />
                                <AvatarFallback>{(req.displayName || req.fullName || req.username)?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <Link href={`/profile/${req.id}`} className="font-medium hover:underline">
                                {req.displayName || req.fullName || req.username}
                            </Link>
                            <p className="text-xs text-muted-foreground">Muốn kết bạn với bạn</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(req.id)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Chấp nhận
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(req.id)}>
                            <UserX className="w-4 h-4 mr-2" />
                            Từ chối
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function SuggestedFriendsList() {
    const [users, setUsers] = React.useState<import("@/types/user").User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [requesting, setRequesting] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Need to import userService dynamically or at top level. 
                // Since this is replace_content, I'll add imports in a separate step or assume dynamic import for now if possible? 
                // No, better to add import in a separate step. Here I write the component assuming userService is imported.
                const { userService } = await import('@/lib/api/userService');
                const res = await userService.getAllUsers();
                if (Array.isArray(res.data)) {
                    setUsers(res.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleAddFriend = async (userId: string) => {
        try {
            setRequesting(userId);
            await friendService.sendRequest(userId);
            toast.success("Đã gửi lời mời kết bạn");
            // Optionally remove from list or update UI state
        } catch (error: any) {
            console.error(error);
            toast.error("Không thể gửi lời mời: " + (error.response?.data?.message || "Lỗi không xác định"));
        } finally {
            setRequesting(null);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (users.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Không có gợi ý nào.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
                <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition">
                    <Link href={`/profile/${user.id}`}>
                        <Avatar className="h-12 w-12 cursor-pointer">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 overflow-hidden">
                        <Link href={`/profile/${user.id}`} className="font-semibold hover:underline truncate block">
                            {user.username}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAddFriend(user.id)}
                        disabled={requesting === user.id}
                        title="Kết bạn"
                    >
                        {requesting === user.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <UserPlus className="h-5 w-5 text-muted-foreground hover:text-blue-500" />
                        )}
                    </Button>
                </div>
            ))}
        </div>
    );
}