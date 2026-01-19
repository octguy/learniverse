"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const isAdmin = user.role === "ROLE_ADMIN" ||
          user.roles?.includes("ROLE_ADMIN");

        if (!isAdmin) {
          toast.error("Bạn không có quyền truy cập vào trang quản trị.");
          router.push("/home");
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user && (user.role === "ROLE_ADMIN" || user.roles?.includes("ROLE_ADMIN"));

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "md:ml-16"
        )}
      >
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border w-full">
          <AdminTopbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
