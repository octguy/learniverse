"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, BellRing, Users, Radio, Loader2, RefreshCcw, Search, X, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { adminNotificationService, SendNotificationRequest } from "@/lib/api/adminNotificationService";
import { Notification } from "@/types/notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { adminUserService, UserAdmin } from "@/lib/api/adminUserService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientPage, setClientPage] = useState(0);

  const [mode, setMode] = useState<"BROADCAST" | "SPECIFIC">("BROADCAST");
  const [content, setContent] = useState("");
  
  const [selectedUsers, setSelectedUsers] = useState<UserAdmin[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<UserAdmin[]>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [notificationType, setNotificationType] = useState("SYSTEM");

  const fetchNotifications = async () => {
      try {
          setFetching(true);
          const data = await adminNotificationService.getAllNotifications(0, 100); 
          setNotifications(data.content);
      } catch (error) {
          console.error("Failed to fetch notifications", error);
          toast.error("Không thể tải lịch sử thông báo");
      } finally {
          setFetching(false);
      }
  };

  useEffect(() => {
      fetchNotifications();
  }, []); 

  // Handle User Search (Debounced + Initial Load)
  useEffect(() => {
      const searchUsers = async () => {
        try {
            const data = await adminUserService.getAllUsers(0, 10, userSearchQuery);
            setSearchedUsers(data.content);
        } catch (error) {
            console.error(error);
        }
      };

      if (!userSearchQuery) {
          if (isUserSearchOpen) searchUsers();
          else setSearchedUsers([]);
          return;
      }
      
      const timer = setTimeout(searchUsers, 300);
      return () => clearTimeout(timer);
  }, [userSearchQuery, isUserSearchOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
        toast.error("Nội dung không được để trống");
        return;
    }

    setLoading(true);
    try {
        if (mode === "BROADCAST") {
            await adminNotificationService.broadcastNotification({
                content,
                notificationType: notificationType, 
                relatedEntityType: "ANNOUNCEMENT"
            });
        } else {
            if (selectedUsers.length === 0) {
                toast.error("Vui lòng chọn ít nhất một người nhận");
                setLoading(false);
                return;
            }
            
            const ids = selectedUsers.map(u => u.id);
            await adminNotificationService.sendNotification({
                content,
                recipientIds: ids,
                relatedEntityType: "ANNOUNCEMENT"
            });
        }
        
        toast.success("Đã gửi thông báo thành công!");
        setContent("");
        setSelectedUsers([]);
        
        if (clientPage !== 0) {
            setClientPage(0);
        } else {
            fetchNotifications();
        }
    } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || "Gửi thông báo thất bại: Vui lòng kiểm tra lại dữ liệu");
    } finally {
        setLoading(false);
    }
  };

  const toggleUserSelection = (user: UserAdmin) => {
      if (selectedUsers.find(u => u.id === user.id)) {
          setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
          setSelectedUsers([...selectedUsers, user]);
      }
  };
    
  const getNotificationTypeVariant = (type: string) => {
      if (type === "SYSTEM") return "destructive"; 
      if (type === "BROADCAST") return "default";
      return "secondary";
  }

  const rawRelevantList = notifications.filter(n => 
      ['SYSTEM', 'BROADCAST'].includes(n.notificationType as string)
  );
  const dedupedList = Array.from(new Map(
    rawRelevantList.map(item => {
        const timeKey = item.createdAt ? item.createdAt.substring(0, 16) : 'unknown';
        const uniqueKey = `${item.content}-${item.notificationType}-${timeKey}`;
        return [uniqueKey, item];
    }) 
  ).values());

  const totalPages = Math.ceil(dedupedList.length / 4);
  const relevantNotifications = dedupedList.slice(clientPage * 4, (clientPage + 1) * 4);

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Thông báo</h2>
          <p className="text-muted-foreground">Gửi thông báo hệ thống và xem lịch sử.</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gửi thông báo mới</CardTitle>
              <CardDescription>Soạn tin nhắn để gửi đến người dùng.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <Tabs defaultValue="BROADCAST" onValueChange={(v) => { setMode(v as any); setContent(""); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="BROADCAST">Gửi toàn bộ (Broadcast)</TabsTrigger>
                        <TabsTrigger value="SPECIFIC">Gửi cá nhân</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4 space-y-4">
                        {mode === "BROADCAST" && (
                            <div className="space-y-2">
                                <Label>Loại thông báo</Label>
                                <Select value={notificationType} onValueChange={setNotificationType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BROADCAST">Tin tức / Sự kiện (Broadcast)</SelectItem>
                                        <SelectItem value="SYSTEM">Quan trọng / Bảo trì (System)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    &apos;Tin tức&apos;: Thông báo chung. &apos;Quan trọng&apos;: Cảnh báo hệ thống (hiển thị màu đỏ).
                                </p>
                            </div>
                        )}

                        {mode === "SPECIFIC" && (
                             <div className="space-y-2">
                                <Label>Người nhận</Label>
                                
                                <Popover open={isUserSearchOpen} onOpenChange={setIsUserSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={isUserSearchOpen} className="w-full justify-between">
                                            {selectedUsers.length > 0 
                                                ? `Đã chọn ${selectedUsers.length} người dùng` 
                                                : "Tìm kiếm người dùng..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput 
                                                placeholder="Tìm theo tên, email..." 
                                                value={userSearchQuery}
                                                onValueChange={setUserSearchQuery}
                                            />
                                            <CommandList>
                                                {searchedUsers.length === 0 && (
                                                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                                )}
                                                <CommandGroup heading="Kết quả tìm kiếm">
                                                    {searchedUsers.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            onSelect={() => toggleUserSelection(user)}
                                                            className="flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <div className={cn(
                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                selectedUsers.find(u => u.id === user.id)
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "opacity-50 [&_svg]:invisible"
                                                            )}>
                                                                <Check className={cn("h-4 w-4")} />
                                                            </div>
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={user.avatarUrl || ""} />
                                                                <AvatarFallback>U</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{user.username}</span>
                                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {selectedUsers.map(user => (
                                            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                                {user.username}
                                                <X 
                                                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                                    onClick={() => toggleUserSelection(user)}
                                                />
                                            </Badge>
                                        ))}
                                        {selectedUsers.length > 0 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-5 text-xs text-destructive hover:text-destructive"
                                                onClick={() => setSelectedUsers([])}
                                            >
                                                Xóa hết
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label>Nội dung</Label>
                            <Textarea 
                                placeholder="Nhập nội dung thông báo..." 
                                className="min-h-[120px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </Tabs>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {loading ? "Đang xử lý..." : "Gửi thông báo"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lịch sử hệ thống</CardTitle>
                <CardDescription>Thông báo System & Broadcast gần đây.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => fetchNotifications()} disabled={fetching}>
                  <RefreshCcw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
                {fetching && notifications.length === 0 ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground"/></div>
                ) : relevantNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {notifications.length > 0 
                            ? "Không có thông báo hệ thống nào trong trang này." 
                            : "Chưa có thông báo nào."}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {relevantNotifications.map((notif) => (
                            <div key={notif.id} className="flex gap-4 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                <div className="mt-1">
                                    <BellRing className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={getNotificationTypeVariant(notif.notificationType) as any} className="text-[10px] px-1 py-0 h-5">
                                            {notif.notificationType === 'SYSTEM' ? 'INDIVIDUAL' : 'BROADCAST'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {notif.createdAt ? format(new Date(notif.createdAt), "dd/MM HH:mm") : ""}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{notif.content}</p>
                                    {notif.relatedEntityType && (
                                         <p className="text-xs text-muted-foreground mt-1">Ref: {notif.relatedEntityType}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                 <div className="flex items-center justify-center space-x-2 py-4 mt-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClientPage(p => Math.max(0, p - 1))}
                        disabled={clientPage === 0 || fetching}
                    >
                        Trước
                    </Button>
                    <div className="text-sm font-medium">
                        Trang {clientPage + 1} / {totalPages > 0 ? totalPages : 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClientPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={clientPage >= totalPages - 1 || fetching}
                    >
                       Sau
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}