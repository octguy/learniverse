"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  Settings,
  LogOut,
  X,
  BookOpen,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function AdminSidebar({ open, setOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Người dùng", href: "/admin/users", icon: Users },
    { name: "Nội dung", href: "/admin/content", icon: FileText },
    { name: "Thẻ (Tags)", href: "/admin/tags", icon: BookOpen },
    { name: "Thông báo", href: "/admin/announcements", icon: Megaphone },
    { name: "Báo cáo", href: "/admin/reports", icon: Flag },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col",
        open
          ? "w-64 translate-x-0"
          : "w-64 -translate-x-full md:w-16 md:translate-x-0"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-2", !open && "md:hidden")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || ""} alt={user?.username || "Admin"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {(user?.username || "AD").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-lg text-sidebar-foreground truncate max-w-[150px]" title={user?.username || "Admin"}>
            {user?.username || "Admin"}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-sidebar-foreground"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                !open && "md:justify-center md:px-0"
              )}
              title={!open ? item.name : undefined}
            >
              <item.icon size={20} />
              <span className={cn(!open && "md:hidden")}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
            !open && "md:justify-center md:px-0"
          )}
          onClick={logout}
        >
          <LogOut size={20} />
          <span className={cn("ml-2", !open && "md:hidden")}>Đăng xuất</span>
        </Button>
      </div>
    </aside>
  );
}
