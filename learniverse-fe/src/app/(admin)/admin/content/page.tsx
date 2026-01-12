"use client";

import { useEffect, useState } from "react";
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
import { Search, MoreHorizontal, Loader2, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminContentService } from "@/lib/api/adminContentService";
import { AdminPostView } from "@/components/admin/AdminPostView";
import { Post } from "@/types/post";
import { ContentStatus, AdminPostDto, AdminQuestionDto } from "@/types/adminContent";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";



function getStatusBadge(status?: ContentStatus) {
    if (!status) return <Badge variant="outline">N/A</Badge>;
    switch (status) {
        case "PUBLISHED": return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Công khai</Badge>;
        case "DRAFT": return <Badge variant="secondary">Nháp</Badge>;
        case "ARCHIVED": return <Badge variant="outline">Lưu trữ</Badge>;
        case "DELETED": return <Badge variant="destructive">Đã xóa</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"questions" | "posts">("posts");

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

      <Tabs defaultValue="posts" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="posts">Bài viết (Posts)</TabsTrigger>
          <TabsTrigger value="questions">Câu hỏi (Questions)</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostTable active={activeTab === "posts"} />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionTable active={activeTab === "questions"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionTable({ active }: { active: boolean }) {
    const [data, setData] = useState<AdminQuestionDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState<ContentStatus | "ALL">("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [totalPages, setTotalPages] = useState(0);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await adminContentService.getQuestions({
                page,
                size: 10,
                status: status === "ALL" ? undefined : status,
                keyword: debouncedSearch,
                sort: ["createdAt,desc"]
            });
            
            setData(res.content || []);
            setTotalPages(res.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách câu hỏi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (active) {
            loadData();
        }
    }, [active, page, status, debouncedSearch]);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await adminContentService.updateQuestionStatus(deleteId, "DELETED");
            toast.success("Đã xóa câu hỏi");
            loadData();
        } catch (error) {
             toast.error("Xóa thất bại");
        }
    };

    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Tìm kiếm câu hỏi..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="PUBLISHED">Công khai</SelectItem>
                            <SelectItem value="DRAFT">Nháp</SelectItem>
                            <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                            <SelectItem value="DELETED">Đã xóa</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[400px]">Tiêu đề</TableHead>
                            <TableHead>Tác giả</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Thống kê</TableHead>
                            <TableHead>Ngày đăng</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy dữ liệu.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Link href={`/questions/${item.slug}`} className="font-medium hover:underline text-primary line-clamp-1" target="_blank">
                                                {item.title}
                                            </Link>
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {item.bodyExcerpt}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{item.author.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(item.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <div>{item.voteScore} votes</div>
                                            <div>{item.answerCount} answers</div>
                                            <div>{item.viewCount} views</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.publishedAt ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: vi }) : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionsMenu
                                            viewLink={`/questions/${item.slug}`}
                                            onDelete={() => handleDeleteClick(item.id)}
                                        />
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
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                >
                    Trước
                </Button>
                <div className="text-sm text-muted-foreground">
                    Trang {page + 1} / {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                >
                    Sau
                </Button>
            </div>

            <ConfirmDialog 
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Xác nhận xóa câu hỏi"
                description="Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                variant="destructive"
                confirmText="Xóa"
            />
        </div>
    );
}


function PostTable({ active }: { active: boolean }) {
    const [data, setData] = useState<AdminPostDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState<ContentStatus | "ALL">("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [totalPages, setTotalPages] = useState(0);

    // View Details State
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await adminContentService.getPosts({
                page,
                size: 10,
                status: status === "ALL" ? undefined : status,
                keyword: debouncedSearch,
                sort: ["createdAt,desc"]
            });
            
            setData(res.content || []);
            setTotalPages(res.totalPages || 0);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải danh sách bài viết");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (active) {
            loadData();
        }
    }, [active, page, status, debouncedSearch]);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await adminContentService.updatePostStatus(deleteId, "DELETED");
            toast.success("Đã xóa bài viết");
            loadData();
        } catch (error) {
             toast.error("Xóa thất bại");
        }
    };

    const handleViewDetails = async (id: string) => {
        setLoadingDetail(true);
        try {
            const post = await adminContentService.getPost(id);
            if(post) {
                setSelectedPost(post);
                setIsViewOpen(true);
            }
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải chi tiết bài viết, tham khảo Console");
        } finally {
            setLoadingDetail(false);
        }
    };


    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Tìm kiếm bài viết..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {loadingDetail && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                 <div className="flex items-center gap-2">
                     <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="PUBLISHED">Công khai</SelectItem>
                            <SelectItem value="DRAFT">Nháp</SelectItem>
                            <SelectItem value="ARCHIVED">Lưu trữ</SelectItem>
                            <SelectItem value="DELETED">Đã xóa</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[400px]">Tiêu đề</TableHead>
                            <TableHead>Tác giả</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Thống kê</TableHead>
                             <TableHead>Nhóm</TableHead>
                            <TableHead>Ngày đăng</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy dữ liệu.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-foreground line-clamp-1">
                                                {item.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {item.bodyExcerpt}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{item.author.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(item.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <div>{item.reactionCount} reactions</div>
                                            <div>{item.commentCount} comments</div>
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        {item.groupName ? <Badge variant="outline">{item.groupName}</Badge> : "-"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.publishedAt ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: vi }) : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ActionsMenu
                                            onDelete={() => handleDeleteClick(item.id)}
                                            showViewDetails={true}
                                            onViewDetails={() => handleViewDetails(item.id)}
                                        />
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
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                >
                    Trước
                </Button>
                <div className="text-sm text-muted-foreground">
                    Trang {page + 1} / {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                >
                    Sau
                </Button>
            </div>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-[70vw] sm:max-w-[70vw] w-full h-[75vh] p-0 flex flex-col bg-background border shadow-lg overflow-hidden">
                     <DialogHeader className="sr-only">
                        <DialogTitle>Chi tiết bài viết</DialogTitle>
                         <DialogDescription>
                            Chi tiết bài viết
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPost ? (
                         <div className="flex-1 w-full h-full overflow-hidden">
                             <AdminPostView post={selectedPost} />
                        </div>
                    ) : (
                         <div className="flex justify-center p-8 bg-background rounded-md"><Loader2 className="animate-spin" /></div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog 
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Xác nhận xóa bài viết"
                description="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                variant="destructive"
                confirmText="Xóa"
            />
        </div>
    );
}

function ActionsMenu({
    viewLink,
    showViewDetails = true,
    onDelete,
    onViewDetails
}: {
    viewLink?: string;
    showViewDetails?: boolean;
    onDelete: () => void;
    onViewDetails?: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {showViewDetails && viewLink && (
                    <DropdownMenuItem asChild>
                        <Link href={viewLink} target="_blank">
                            <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                        </Link>
                    </DropdownMenuItem>
                )}

                {showViewDetails && onViewDetails && (
                    <DropdownMenuItem onClick={onViewDetails}>
                        <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                    </DropdownMenuItem>
                )}
                
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Xóa
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

