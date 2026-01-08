"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Eye, CheckCircle, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

// Mock data mô phỏng DTO trả về từ ContentReportController
const reports = [
  {
    id: 1,
    type: "POST",
    contentId: 101,
    reason: "SPAM",
    reporter: "user_a",
    status: "PENDING",
    createAt: "2024-01-01",
  },
  {
    id: 2,
    type: "QUESTION",
    contentId: 202,
    reason: "HARASSMENT",
    reporter: "user_b",
    status: "RESOLVED",
    createAt: "2024-01-02",
  },
  {
    id: 3,
    type: "COMMENT",
    contentId: 303,
    reason: "INAPPROPRIATE_CONTENT",
    reporter: "user_c",
    status: "PENDING",
    createAt: "2024-01-03",
  },
];

export default function ReportsPage() {
  const [filter, setFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // Mock save function
  const handleSaveConfig = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Đã lưu quy định kiểm duyệt thành công!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Báo cáo & Kiểm duyệt</h2>
        <p className="text-muted-foreground">
          Xử lý báo cáo vi phạm và cấu hình quy tắc kiểm duyệt nội dung.
        </p>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="reports">Danh sách Báo cáo</TabsTrigger>
          <TabsTrigger value="moderation">Quy định & Bộ lọc</TabsTrigger>
        </TabsList>

        {/* Tab 1: Danh sách Báo cáo */}
        <TabsContent value="reports" className="space-y-4 pt-4">
            <div className="flex justify-between items-center bg-card p-2 rounded border">
                <span className="text-sm font-medium px-2">Bộ lọc trạng thái:</span>
                <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                </SelectContent>
                </Select>
            </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại nội dung</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Người báo cáo</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="outline">{report.type}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {report.contentId}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{report.reason}</TableCell>
                    <TableCell>{report.reporter}</TableCell>
                    <TableCell>{report.createAt}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "PENDING" ? "destructive" : "secondary"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Xem nội dung">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-500 hover:text-green-600"
                              title="Bỏ qua/Đã xem"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              title="Xóa nội dung"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: Cấu hình Kiểm duyệt (Moved from Settings) */}
        <TabsContent value="moderation" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Kiểm duyệt Tự động</CardTitle>
              <CardDescription>
                Thiết lập bộ lọc từ khóa và giới hạn upload để ngăn chặn nội dung không phù hợp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="censoredWords">
                  Từ khóa bị cấm (ngăn cách bằng dấu phẩy)
                </Label>
                <Textarea
                  id="censoredWords"
                  className="min-h-[120px]"
                  placeholder="badword1, badword2, spam..."
                  defaultValue="admin, root, system, spam, hack"
                />
                <p className="text-sm text-muted-foreground">
                  Những từ này sẽ bị chặn hoặc thay thế bằng *** khi người dùng đăng bài.
                </p>
              </div>

              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="maxUploadSize">
                  Giới hạn dung lượng file upload (MB)
                </Label>
                <Input id="maxUploadSize" type="number" defaultValue="5" />
                <p className="text-sm text-muted-foreground">
                    Giới hạn dung lượng tối đa cho mỗi file được tải lên trong bài viết/câu hỏi.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveConfig} disabled={isLoading}>
                {isLoading ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />} 
                Lưu cấu hình
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}