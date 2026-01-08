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
import { Search, Loader2, UserCog, Ban, CheckCircle2, MoreHorizontal, Plus, ShieldAlert } from "lucide-react";
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
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);

  const [newStatus, setNewStatus] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newAdminData, setNewAdminData] = useState({ email: "", username: "" });

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

  const openBanDialog = (user: UserAdmin) => {
      setSelectedUser(user);
      setIsBanDialogOpen(true);
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

  const handleBanUser = async () => {
      if (!selectedUser) return;
      try {
          await adminUserService.updateUserStatus(selectedUser.id, "BANNED");
          toast.success("Đã cấm người dùng thành công");
          setIsBanDialogOpen(false);
          fetchUsers();
      } catch (error: any) {
          toast.error("Thao tác thất bại");
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

  const handleCreateAdmin = async () => {
      if (!newAdminData.email || !newAdminData.username) {
          toast.error("Vui lòng điền đầy đủ thông tin");
          return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newAdminData.email)) {
          toast.error("Email không hợp lệ");
          return;
      }

      try {
          await adminUserService.registerAdmin(newAdminData);
          toast.success("Tạo tài khoản Admin thành công. Mật khẩu đã được gửi đến email.");
          setIsAdminDialogOpen(false);
          setNewAdminData({ email: "", username: "" });
          fetchUsers();
      } catch (error: any) {
           toast.error(error.message || "Tạo Admin thất bại");
      }
  }

  const getRoleBadgeVariant = (role: string) => {
      switch (role) {
          case "ROLE_ADMIN": return "destructive";
          default: return "secondary";
      }
  };

  const getStatusBadgeVariant = (status: string) => {
      switch (status) {
          case "ACTIVE": return "outline"; // Green-ish usually handled by class or outline
          case "BANNED": return "destructive";
          default: return "secondary"; // Inactive
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
        <Button onClick={() => setIsAdminDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Thêm Admin
        </Button>
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
                    <Badge variant={getStatusBadgeVariant(u.status)} className={u.status === 'ACTIVE' ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : ""}>
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
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Cập nhật trạng thái
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openBanDialog(u)} className="text-red-600 focus:text-red-600">
                                <Ban className="mr-2 h-4 w-4" />
                                Cấm người dùng (Ban)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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

      {/* Dialog: Status Update */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Kiểm soát trạng thái hoạt động của <b>{selectedUser?.username}</b>.<br/>
              <span className="text-xs text-muted-foreground">Lưu ý: Để cấm người dùng, vui lòng sử dụng chức năng "Cấm người dùng".</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="flex flex-col gap-2">
                <Label>Trạng thái</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE (Hoạt động)</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE (Tạm ngưng)</SelectItem>
                        {/* BANNED removed from here as per requirement */}
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

      {/* Dialog: Ban Confirmation */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5"/> Cấm người dùng vĩnh viễn
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>Bạn có chắc chắn muốn cấm người dùng <b>{selectedUser?.username}</b> không?</p>
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-200">
                  <strong>Cảnh báo:</strong> Người dùng bị cấm sẽ không thể đăng nhập vào hệ thống vĩnh viễn trừ khi được gỡ bỏ lệnh cấm bởi Quản trị viên.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>Hủy bỏ</Button>
            <Button variant="destructive" onClick={handleBanUser}>Xác nhận Cấm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Role Update */}
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

      {/* Dialog: Create Admin */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Admin mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản quản trị viên mới. Mật khẩu ngẫu nhiên sẽ được gửi đến email đăng ký.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="flex flex-col gap-2">
                <Label>Username</Label>
                <Input 
                    value={newAdminData.username} 
                    onChange={(e) => setNewAdminData({...newAdminData, username: e.target.value})}
                    placeholder="Nhập tên đăng nhập..."
                />
             </div>
             <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input 
                    type="email"
                    value={newAdminData.email} 
                    onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                    placeholder="example@learniverse.com"
                />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateAdmin}>Tạo Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
