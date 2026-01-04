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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// Import các API service tương ứng nếu đã có, ví dụ: import { getAllUsers } from "@/lib/api/userService";

export default function UsersManagementPage() {
  const [loading, setLoading] = useState(true);

  // Mock data - Thay thế bằng call API thực tế
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Nguyen Van A",
      email: "a@example.com",
      role: "USER",
      status: "ACTIVE",
      avatar: "",
    },
    {
      id: 2,
      name: "Tran Thi B",
      email: "b@example.com",
      role: "ADMIN",
      status: "ACTIVE",
      avatar: "",
    },
    {
      id: 3,
      name: "Le Van C",
      email: "c@example.com",
      role: "USER",
      status: "BANNED",
      avatar: "",
    },
  ]);

  useEffect(() => {
    // Giả lập loading API
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Quản lý người dùng
          </h2>
          <p className="text-muted-foreground">
            Danh sách tất cả người dùng trong hệ thống.
          </p>
        </div>
        <Button>Thêm người dùng (Tùy chọn)</Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm theo email hoặc tên..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Tên hiển thị</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Không tìm thấy người dùng
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === "ACTIVE" ? "outline" : "destructive"
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">
                      Sửa
                    </Button>
                    <Button variant="destructive" size="sm">
                      Khóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
