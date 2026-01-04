"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; // Hoặc hook toast của bạn
import { Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock states - Sau này sẽ fetch từ API /admin/settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const [emailVerification, setEmailVerification] = useState(true);

  const handleSave = () => {
    setIsLoading(true);
    // Giả lập gọi API lưu settings
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Đã lưu cài đặt hệ thống thành công!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-muted-foreground">
          Quản lý các cấu hình chung và tham số vận hành của Learniverse.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="security">Bảo mật & User</TabsTrigger>
          <TabsTrigger value="content">Nội dung</TabsTrigger>
        </TabsList>

        {/* Tab: Cài đặt Chung */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Website</CardTitle>
              <CardDescription>
                Các thiết lập hiển thị cơ bản của hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="siteName">Tên hệ thống</Label>
                <Input id="siteName" defaultValue="Learniverse" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                <Input
                  id="supportEmail"
                  defaultValue="support@learniverse.com"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Chế độ bảo trì</Label>
                  <p className="text-sm text-muted-foreground">
                    Tạm ngưng truy cập của người dùng (ngoại trừ Admin).
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
              {maintenanceMode && (
                <div className="space-y-1 animate-in fade-in zoom-in">
                  <Label htmlFor="maintenanceMsg">Thông báo bảo trì</Label>
                  <Textarea
                    id="maintenanceMsg"
                    placeholder="Hệ thống đang bảo trì, vui lòng quay lại sau..."
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <span className="animate-spin mr-2">⏳</span>}
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab: Bảo mật & Người dùng */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Người dùng</CardTitle>
              <CardDescription>
                Kiểm soát việc đăng ký và xác thực tài khoản.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lưu ý quan trọng</AlertTitle>
                <AlertDescription>
                  Thay đổi cài đặt xác thực có thể ảnh hưởng đến người dùng đang
                  đăng ký mới.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Cho phép đăng ký mới</Label>
                  <p className="text-sm text-muted-foreground">
                    Tắt nếu bạn muốn đóng cổng đăng ký thành viên.
                  </p>
                </div>
                <Switch
                  checked={allowSignup}
                  onCheckedChange={setAllowSignup}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Yêu cầu xác thực Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Người dùng mới phải xác nhận email trước khi đăng nhập.
                  </p>
                </div>
                <Switch
                  checked={emailVerification}
                  onCheckedChange={setEmailVerification}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab: Kiểm duyệt Nội dung */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Kiểm duyệt nội dung</CardTitle>
              <CardDescription>
                Thiết lập bộ lọc tự động cho bài viết và bình luận.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="censoredWords">
                  Từ khóa bị cấm (ngăn cách bằng dấu phẩy)
                </Label>
                <Textarea
                  id="censoredWords"
                  className="min-h-[100px]"
                  placeholder="badword1, badword2, spam..."
                  defaultValue="admin, root, system"
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  Những từ này sẽ bị chặn hoặc thay thế bằng *** khi người dùng
                  đăng bài.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxUploadSize">
                  Giới hạn dung lượng file upload (MB)
                </Label>
                <Input id="maxUploadSize" type="number" defaultValue="5" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
