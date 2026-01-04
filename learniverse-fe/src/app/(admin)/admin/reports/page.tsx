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
import { Eye, CheckCircle, Trash2 } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Báo cáo</h2>
          <p className="text-muted-foreground">
            Xử lý các báo cáo vi phạm từ người dùng.
          </p>
        </div>

        {/* Filter Status */}
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
    </div>
  );
}
