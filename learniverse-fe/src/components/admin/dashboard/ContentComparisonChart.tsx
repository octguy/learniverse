"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import { adminService } from "@/lib/api/adminService";
import { ComparisonDataPoint } from "@/types/dashboard";

export function ContentComparisonChart({ period }: { period: string }) {
  const [data, setData] = useState<ComparisonDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const apiPeriod = period.toUpperCase() as 'DAY' | 'MONTH' | 'YEAR';
        const response = await adminService.getContentComparison(apiPeriod);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch content comparison data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Nội dung (Post vs Question)</CardTitle>
        <CardDescription>
          So sánh lượng tương tác ({period === 'day' ? '30 ngày gần nhất' : period === 'month' ? '12 tháng gần nhất' : '5 năm gần nhất'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-red-500">
              Lỗi tải dữ liệu
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Chưa có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="postCount"
                  name="Bài viết"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="questionCount"
                  name="Câu hỏi"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

