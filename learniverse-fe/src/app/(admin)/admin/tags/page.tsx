"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tagService, Tag } from "@/lib/api/tagService";
import { toast } from "sonner";

export default function TagsManagementPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [tagsLoading, setTagsLoading] = useState(false);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getAllTags(page, pageSize, searchQuery);
      setTags(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      toast.error("Không thể tải danh sách thẻ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchTags();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); 
  };

  const openCreateDialog = () => {
    setCurrentTag(null);
    setFormData({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setCurrentTag(tag);
    setFormData({ name: tag.name, description: tag.description || "" });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setCurrentTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setTagsLoading(true);
      if (currentTag) {
        await tagService.updateTag(currentTag.id, formData);
        toast.success("Cập nhật thẻ thành công");
      } else {
        await tagService.createTag(formData);
        toast.success("Tạo thẻ mới thành công");
      }
      setIsDialogOpen(false);
      fetchTags();
    } catch (error) {
        console.error("Error saving tag:", error);
        toast.error("Có lỗi xảy ra khi lưu thẻ");
    } finally {
      setTagsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTag) return;
    try {
      setTagsLoading(true);
      await tagService.deleteTag(currentTag.id);
      toast.success("Xóa thẻ thành công");
      setIsDeleteDialogOpen(false);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Có lỗi xảy ra khi xóa thẻ");
    } finally {
        setTagsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Tags</h2>
          <p className="text-muted-foreground">
            Danh sách các chủ đề thảo luận.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Tạo Tag mới
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm thẻ..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Tag</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Số bài viết</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Đang tải...
                    </TableCell>
                </TableRow>
            ) : tags.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Không tìm thấy thẻ nào.
                    </TableCell>
                </TableRow>
            ) : (
                tags.map((tag) => (
                <TableRow key={tag.id}>
                    <TableCell className="font-medium text-primary">
                    {tag.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                    <TableCell className="max-w-md truncate">{tag.description}</TableCell>
                    <TableCell>{tag.postCount || 0}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(tag)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => openDeleteDialog(tag)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
        
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
        >
            Trước
        </Button>
        <div className="text-sm font-medium">
            Trang {page + 1} / {totalPages || 1}
        </div>
        <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
        >
            Sau
        </Button>
      </div>

      {/* dialog add/sửa tag */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentTag ? "Cập nhật Tag" : "Tạo Tag Mới"}</DialogTitle>
             <DialogDescription>
                {currentTag ? "Chỉnh sửa thông tin thẻ." : "Thêm thẻ mới vào hệ thống."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên Tag <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ví dụ: Java"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc" className="text-right">
                Mô tả
              </Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả ngắn gọn..."
                className="col-span-3"
              />
            </div>
            <DialogFooter>
               <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={tagsLoading}>
                  {tagsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* dialog xác nhận xóa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
             <DialogDescription>
                Bạn có chắc chắn muốn xóa thẻ "{currentTag?.name}" không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
             <Button variant="destructive" onClick={handleDelete} disabled={tagsLoading}>
                {tagsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xóa
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
