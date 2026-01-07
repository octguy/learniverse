"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Search, Loader2, UserCog, Ban, CheckCircle2, MoreHorizontal } from "lucide-react";
import { adminUserService, UserAdmin } from "@/lib/api/adminUserService";
import { userProfileService } from "@/lib/api/userProfileService";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function UsersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserAdmin | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newRole, setNewRole] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAllUsers(page, pageSize, searchQuery);

      const enrichedUsers = await Promise.all(
        data.content.map(async (u: any) => {
          try {
             const profile = await userProfileService.getUserProfile(u.id);
             return {
                ...u,
                avatarUrl: profile.avatarUrl,
                role: profile.role || u.role || "ROLE_USER" 
             } as UserAdmin;
          } catch (e) {
             return u as UserAdmin;
          }
        })
      );

      setUsers(enrichedUsers);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error(error.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const openStatusDialog = (user: UserAdmin) => {
      setSelectedUser(user);
      setNewStatus(user.status || "ACTIVE");
      setIsStatusDialogOpen(true);
  }

  const openRoleDialog = (user: UserAdmin) => {
      setSelectedUser(user);
      let initialRole: string = user.role || "ROLE_USER";
      if (!initialRole.startsWith("ROLE_")) {
          initialRole = `ROLE_${initialRole}`;
      }
      setNewRole(initialRole);
      setIsRoleDialogOpen(true);
  }

  const handleSaveStatus = async () => {
      if (!selectedUser) return;
      try {
          await adminUserService.updateUserStatus(selectedUser.id, newStatus);
          toast.success("Cập nhật trạng thái thành công");
          setIsStatusDialogOpen(false);
          fetchUsers();
      } catch (error: any) {
          toast.error("Cập nhật trạng thái thất bại");
      }
  };

  const handleSaveRole = async () => {
      if (!selectedUser) return;
      try {
          await adminUserService.updateUserRole(selectedUser.id, newRole);
          toast.success("Cập nhật vai trò thành công");
          setIsRoleDialogOpen(false);
          fetchUsers();
      } catch (error: any) {
          toast.error("Cập nhật vai trò thất bại");
      }
  };

  const getRoleBadgeVariant = (role: string) => {
      switch (role) {
          case "ROLE_ADMIN": return "destructive";
          case "ROLE_MODERATOR": return "default"; 
          default: return "secondary";
      }
  };

  const getStatusBadgeVariant = (status: string) => {
      switch (status) {
          case "ACTIVE": return "outline"; 
          case "BANNED": return "destructive";
          default: return "secondary";
      }
  };

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
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm theo email hoặc tên..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Username & Email</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Không tìm thấy người dùng
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow 
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/profile/${u.id}`)}
                >
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={u.avatarUrl || ""} />
                      <AvatarFallback>{u.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                          <span className="font-medium">{u.username}</span>
                          <span className="text-sm text-muted-foreground">{u.email}</span>
                      </div>
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(u.role)}>
                      {(u.role || "USER").replace("ROLE_", "")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(u.status)}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openStatusDialog(u)}>
                                <Ban className="mr-2 h-4 w-4" />
                                Cập nhật trạng thái
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRoleDialog(u)}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Phân quyền (Role)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Dialogs */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Thay đổi trạng thái hoạt động cho người dùng <b>{selectedUser?.username}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="flex flex-col gap-2">
                <Label>Trạng thái mới</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Active (Hoạt động)</SelectItem>
                        <SelectItem value="INACTIVE">Inactive (Vô hiệu hóa)</SelectItem>
                        <SelectItem value="BANNED">Banned (Cấm)</SelectItem>
                        <SelectItem value="PENDING_VERIFICATION">Pending (Chờ xác thực)</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveStatus}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân quyền người dùng</DialogTitle>
            <DialogDescription>
              Thay đổi vai trò hệ thống cho người dùng <b>{selectedUser?.username}</b>
            </DialogDescription>
          </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="flex flex-col gap-2">
                <Label>Vai trò mới</Label>
                 <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ROLE_USER">USER (Người dùng)</SelectItem>
                        <SelectItem value="ROLE_MODERATOR">MODERATOR (Điều hành viên)</SelectItem>
                        <SelectItem value="ROLE_ADMIN">ADMIN (Quản trị viên)</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveRole}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
