"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, BellRing } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Hoặc dùng toast của bạn

export default function AnnouncementsPage() {
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Giả lập gọi API gửi thông báo
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    toast.success("Đã gửi thông báo đến toàn bộ hệ thống!");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Form Gửi Thông Báo */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Thông báo hệ thống</h2>
          <p className="text-muted-foreground">Gửi tin nhắn broadcast đến tất cả người dùng.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Soạn thông báo mới</CardTitle>
            <CardDescription>Tin nhắn sẽ hiển thị trong phần thông báo của người dùng.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input id="title" placeholder="Ví dụ: Bảo trì hệ thống 12/2024" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Loại thông báo</Label>
                <Select defaultValue="INFO">
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Thông tin (Info)</SelectItem>
                    <SelectItem value="WARNING">Cảnh báo (Warning)</SelectItem>
                    <SelectItem value="URGENT">Khẩn cấp (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung chi tiết</Label>
                <Textarea 
                  id="content" 
                  placeholder="Nhập nội dung thông báo..." 
                  className="min-h-[150px]" 
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang gửi..." : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Gửi ngay
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Lịch sử thông báo */}
      <div className="space-y-6 mt-14">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Lịch sử gửi gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex">
                  <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center mr-4">
                    <BellRing className="h-5 w-5 text-primary" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Cập nhật tính năng Chat</p>
                    <p className="text-sm text-muted-foreground">
                      Đã gửi cho 1,234 users • Admin • 2 ngày trước
                    </p>
                    <div className="text-xs bg-muted p-2 rounded text-muted-foreground">
                      Chúng tôi vừa cập nhật tính năng chat nhóm mới, hãy thử ngay!
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}