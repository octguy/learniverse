"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  FileText,
  HelpCircle,
} from "lucide-react";
import { adminService } from "@/lib/api/adminService";
import { DashboardStatsResponse } from "@/types/dashboard";

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      title: "Tổng người dùng",
      value: loading ? "..." : stats?.totalUsers?.toLocaleString() ?? "0",
      change: "Tổng số user",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "User mới hôm nay",
      value: loading ? "..." : stats?.newUsersToday?.toLocaleString() ?? "0",
      change: "Đăng ký hôm nay",
      icon: UserPlus,
      color: "text-green-600",
    },
    {
      title: "Tổng bài viết",
      value: loading ? "..." : stats?.totalPosts?.toLocaleString() ?? "0",
      change: "Bài viết chia sẻ",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Tổng câu hỏi",
      value: loading ? "..." : stats?.totalQuestions?.toLocaleString() ?? "0",
      change: "Câu hỏi thảo luận",
      icon: HelpCircle,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{item.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
