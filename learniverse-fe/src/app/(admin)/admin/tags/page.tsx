"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TagsManagementPage() {
  const tags = [
    { id: 1, name: "Java", description: "Lập trình Java căn bản", count: 120 },
    {
      id: 2,
      name: "Spring Boot",
      description: "Framework Java Web",
      count: 85,
    },
    { id: 3, name: "ReactJS", description: "Frontend Library", count: 200 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Tags</h2>
          <p className="text-muted-foreground">
            Danh sách các chủ đề thảo luận.
          </p>
        </div>

        {/* Create Tag Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tạo Tag mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo Tag Mới</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Tên Tag
                </Label>
                <Input
                  id="name"
                  placeholder="Ví dụ: Java"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">
                  Mô tả
                </Label>
                <Textarea
                  id="desc"
                  placeholder="Mô tả ngắn gọn..."
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Tag</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số bài viết</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-bold text-primary">
                  #{tag.name}
                </TableCell>
                <TableCell>{tag.description}</TableCell>
                <TableCell>{tag.count}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
