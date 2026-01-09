"use client";

import { useEffect, useState, useCallback } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Eye, CheckCircle, Save, XCircle, AlertTriangle, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { reportService } from "@/lib/api/reportService";
import { postService } from "@/lib/api/postService";
import { questionService } from "@/lib/api/questionService";
import { answerService } from "@/lib/api/answerService";
import { ReportDTO, ReportStatus } from "@/types/report";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReportsPage() {
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [reports, setReports] = useState<ReportDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const [selectedReport, setSelectedReport] = useState<ReportDTO | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [resolveNote, setResolveNote] = useState("");
    const [resolveAction, setResolveAction] = useState("NONE");
    const [isResolving, setIsResolving] = useState(false);
    
    const [targetContent, setTargetContent] = useState<any>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                size: pageSize,
                sort: ["createdAt,DESC"]
            };
            
            if (filterStatus !== "ALL") {
                params.status = filterStatus;
            }
            
            const response = await reportService.getReports(params);
            setReports(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            toast.error("Không thể tải danh sách báo cáo");
        } finally {
            setIsLoading(false);
        }
    }, [filterStatus, page]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleViewReport = async (reportId: string) => {
        try {
            const response = await reportService.getReportDetail(reportId);
            const detail = response.data;
            setSelectedReport(detail);
            setIsDetailOpen(true);
            setResolveAction(detail.actionTaken || "NONE");
            setResolveNote(detail.moderatorNote || "");

            setTargetContent(null);
            if (detail.reportableId) {
                fetchTargetContent(detail.reportableType, detail.reportableId);
            }
        } catch (error) {
            toast.error("Không thể tải chi tiết báo cáo");
        }
    };

    const fetchTargetContent = async (type: string, id: string) => {
        setIsLoadingContent(true);
        try {
            let content = null;
            if (type === "POST") {
                const res = await postService.getPostById(id);
                content = res.data; 
            } else if (type === "QUESTION") {
                content = await questionService.getById(id);
            } else if (type === "ANSWER") {
                content = await answerService.getById(id);
            }
            setTargetContent(content);
        } catch (err) {
            console.error("Failed to load full content details", err);
        } finally {
            setIsLoadingContent(false);
        }
    };

    const handleResolve = async (status: ReportStatus, action: string) => {
        if (!selectedReport) return;
        
        setIsResolving(true);
        try {
            await reportService.resolveReport(selectedReport.id, {
                status: status,
                actionTaken: action,
                moderatorNote: resolveNote
            });
            
            toast.success(`Đã xử lý báo cáo: ${status === 'RESOLVED' ? 'Đã giải quyết' : 'Đã từ chối'}`);
            setIsDetailOpen(false);
            fetchReports(); 
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xử lý báo cáo");
        } finally {
            setIsResolving(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm");
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Quản lý Báo cáo</h2>
                <p className="text-muted-foreground">
                    Xem và xử lý các báo cáo vi phạm từ người dùng.
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Trạng thái:</span>
                            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                                    <SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
                                    <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchReports()} disabled={isLoading}>
                        Làm mới
                    </Button>
                </div>

                <div className="rounded-md border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Loại</TableHead>
                                <TableHead>Lý do</TableHead>
                                <TableHead>Người báo cáo</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Đang tải...</TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Không có báo cáo nào</TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <Badge variant="outline">{report.reportableType}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={report.description}>
                                            <div>{report.reason}</div>
                                            <div className="text-xs text-muted-foreground truncate">{report.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{report.reporter?.username || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">ID: {report.reporter?.id.substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    report.status === "PENDING" ? "destructive" :
                                                        report.status === "RESOLVED" ? "default" : "secondary"
                                                }
                                            >
                                                {report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewReport(report.id)}
                                                title="Xem chi tiết & Xử lý"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end gap-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || isLoading}
                    >
                        Trước
                    </Button>
                    <span className="flex items-center text-sm">
                        Trang {page + 1} / {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || isLoading}
                    >
                        Sau
                    </Button>
                </div>
            </div>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Chi tiết Báo cáo</DialogTitle>
                        <DialogDescription>
                            ID: {selectedReport?.id} | Ngày tạo: {formatDate(selectedReport?.createdAt)}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">Người báo cáo</Label>
                                    <div className="font-medium">{selectedReport.reporter?.username}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">Loại nội dung</Label>
                                    <div><Badge variant="outline">{selectedReport.reportableType}</Badge></div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">Lý do</Label>
                                    <div className="font-medium text-red-600">{selectedReport.reason}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase">Trạng thái</Label>
                                    <div>
                                        <Badge variant={selectedReport.status === "PENDING" ? "destructive" : "secondary"}>
                                            {selectedReport.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Nội dung báo cáo</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{selectedReport.description || "Không có mô tả thêm."}</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-red-100 dark:border-red-900/20">
                                        <CardHeader className="pb-2 bg-red-50/50 dark:bg-red-900/10">
                                            <CardTitle className="text-base text-red-700 dark:text-red-400">Nội dung bị báo cáo</CardTitle>
                                            <CardDescription>
                                                Tác giả: <span className="font-medium text-foreground">{selectedReport.targetAuthor?.username}</span> • {formatDate(selectedReport.targetCreatedAt)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            {isLoadingContent ? (
                                                <div className="flex justify-center p-4">
                                                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                </div>
                                            ) : (selectedReport.targetTitle || selectedReport.targetBody || targetContent) ? (
                                                <div className="space-y-3">
                                                    {(targetContent?.title || selectedReport.targetTitle) && (
                                                        <h4 className="font-bold text-lg mb-2">{targetContent?.title || selectedReport.targetTitle}</h4>
                                                    )}
                                                    
                                                    <div className="text-sm p-3 rounded-md border bg-background max-h-[400px] overflow-y-auto">
                                                        {targetContent?.body ? (
                                                            <div className="prose dark:prose-invert max-w-none text-sm [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {targetContent.body}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <div className="whitespace-pre-wrap font-sans">
                                                                {selectedReport.targetBody || <span className="text-muted-foreground italic">Không có nội dung văn bản</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {targetContent?.attachments && targetContent.attachments.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <Label className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                                                                <ImageIcon className="w-3 h-3 mr-1"/> Tệp đính kèm ({targetContent.attachments.length})
                                                            </Label>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                {targetContent.attachments.map((att: any) => (
                                                                    <div key={att.id} className="relative group border rounded bg-background overflow-hidden hover:shadow-sm transition-all">
                                                                        {(att.fileType === "IMAGE" || att.fileType === "image") ? (
                                                                            <a href={att.storageUrl} target="_blank" rel="noopener noreferrer" className="block">
                                                                                <div className="aspect-video relative">
                                                                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                    <img 
                                                                                        src={att.storageUrl} 
                                                                                        alt={att.fileName} 
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                </div>
                                                                            </a>
                                                                        ) : (
                                                                            <a href={att.storageUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 h-full min-h-[80px] hover:bg-muted/50 text-center">
                                                                                <FileText className="w-6 h-6 text-muted-foreground mb-1"/>
                                                                                <span className="text-[10px] text-muted-foreground truncate w-full max-w-full px-1" title={att.fileName}>
                                                                                    {att.fileName}
                                                                                </span>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col space-y-3">
                                                    <div className="flex items-center text-sm text-yellow-600 italic p-2 border border-yellow-200 bg-yellow-50 rounded">
                                                        <AlertTriangle className="w-4 h-4 mr-2"/>
                                                        Không thể tải nội dung đầy đủ (hoặc nội dung đã bị xóa). Dưới đây là thông tin lưu trữ tại thời điểm báo cáo:
                                                    </div>
                                                    <div className="mt-2 space-y-2">
                                                         {selectedReport.targetTitle && <h4 className="font-bold">{selectedReport.targetTitle}</h4>}
                                                         <div className="text-sm p-2 border rounded bg-muted/30 whitespace-pre-wrap">{selectedReport.targetBody}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column: Resolution Actions */}
                                <div className="space-y-4">
                                    <Card className="border-blue-100 dark:border-blue-900/20 h-full">
                                        <CardHeader className="pb-2 bg-blue-50/50 dark:bg-blue-900/10">
                                            <CardTitle className="text-base text-blue-700 dark:text-blue-400">Xử lý vi phạm</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Hành động áp dụng</Label>
                                                <Select 
                                                    value={resolveAction} 
                                                    onValueChange={setResolveAction}
                                                    disabled={selectedReport.status !== "PENDING"}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NONE">Không hành động (Chỉ giải quyết)</SelectItem>
                                                        <SelectItem value="USER_WARNED">Cảnh báo người dùng (Gửi thông báo)</SelectItem>
                                                        <SelectItem value="CONTENT_DELETED">Xóa nội dung vi phạm</SelectItem>
                                                        <SelectItem value="USER_SUSPENDED">Tạm khóa tài khoản</SelectItem>
                                                        <SelectItem value="USER_BANNED">Cấm tài khoản vĩnh viễn</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground p-1">
                                                    * Hành động này sẽ được áp dụng ngay lập tức khi bạn xác nhận.
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label>Ghi chú của Moderator (Bắt buộc khi từ chối/cảnh báo)</Label>
                                                <Textarea 
                                                    value={resolveNote} 
                                                    onChange={(e) => setResolveNote(e.target.value)}
                                                    placeholder="Nhập lý do xử lý hoặc lý do từ chối..."
                                                    className="h-32"
                                                    disabled={selectedReport.status !== "PENDING"}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        {selectedReport?.status === "PENDING" ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleResolve("REJECTED", "NO_VIOLATION")}
                                    disabled={isResolving}
                                >
                                    <XCircle className="w-4 h-4 mr-2"/>
                                    Từ chối báo cáo (Không vi phạm)
                                </Button>
                                <Button 
                                    onClick={() => handleResolve("RESOLVED", resolveAction)}
                                    disabled={isResolving}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isResolving ? "Đang xử lý..." : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2"/>
                                            Xác nhận vi phạm & Xử lý
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                                Đóng
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}