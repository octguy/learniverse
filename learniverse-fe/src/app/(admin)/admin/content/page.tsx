"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ContentManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Quản lý nội dung
          </h2>
          <p className="text-muted-foreground">
            Quản lý các bài viết và câu hỏi trên hệ thống.
          </p>
        </div>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="questions">Câu hỏi (Questions)</TabsTrigger>
            <TabsTrigger value="posts">Bài viết (Posts)</TabsTrigger>
          </TabsList>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm nội dung..." className="pl-8" />
          </div>
        </div>

        {/* Tab Content: Câu hỏi */}
        <TabsContent value="questions">
          <ContentTable type="Question" />
        </TabsContent>

        {/* Tab Content: Bài viết */}
        <TabsContent value="posts">
          <ContentTable type="Post" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component để tái sử dụng logic hiển thị bảng
function ContentTable({ type }: { type: "Question" | "Post" }) {
  // Mock data
  const data = [
    {
      id: 1,
      title:
        type === "Question"
          ? "Làm sao để fix lỗi Java?"
          : "Cách học Spring Boot hiệu quả",
      author: "Dev A",
      stats: "10 votes • 5 comments",
      status: "ACTIVE",
    },
    {
      id: 2,
      title:
        type === "Question"
          ? "React hook loop error?"
          : "Review công nghệ 2024",
      author: "Dev B",
      stats: "2 votes • 0 comments",
      status: "HIDDEN",
    },
  ];

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">Tiêu đề</TableHead>
            <TableHead>Tác giả</TableHead>
            <TableHead>Tương tác</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <a href="#" className="hover:underline text-primary">
                  {item.title}
                </a>
              </TableCell>
              <TableCell>{item.author}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.stats}
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                    <DropdownMenuItem>Ẩn bài này</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Xóa vĩnh viễn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
