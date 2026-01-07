"use client";

import { useState } from "react";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { UserGrowthChart } from "@/components/admin/dashboard/UserGrowthChart";
import { ContentComparisonChart } from "@/components/admin/dashboard/ContentComparisonChart";
import { TopTags, RecentUsers } from "@/components/admin/dashboard/RecentData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

export default function DashboardPage() {
  const [period, setPeriod] = useState("day");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Tổng quan hệ thống và các chỉ số tăng trưởng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <CalendarDays className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString("vi-VN")}
          </Button>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Theo Ngày</SelectItem>
              <SelectItem value="month">Theo Tháng</SelectItem>
              <SelectItem value="year">Theo Năm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <UserGrowthChart period={period} />

        <ContentComparisonChart period={period} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <RecentUsers />

        <TopTags />
      </div>
    </div>
  );
}
