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
      {/* Header & Filter */}
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

      {/* 1. Stats Cards Section */}
      <DashboardStats />

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Biểu đồ tăng trưởng user (3/5 width) - Truyền period state xuống */}
        <UserGrowthChart period={period} />

        {/* Biểu đồ so sánh Post/Question (2/5 width) */}
        <ContentComparisonChart period={period} />
      </div>

      {/* 3. Bottom Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Danh sách user mới (3/5 width) */}
        <RecentUsers />

        {/* Top Tags (2/5 width) */}
        <TopTags />
      </div>
    </div>
  );
}
