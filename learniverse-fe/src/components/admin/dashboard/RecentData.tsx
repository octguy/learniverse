"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/lib/api/adminService";
import { TopTagResponse, NewUserResponse } from "@/types/dashboard";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function TopTags() {
  const [tags, setTags] = useState<TopTagResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await adminService.getTopTags();
        setTags(data);
      } catch (error) {
        console.error("Failed to fetch top tags:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top 5 Tags phổ biến</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : tags.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">Chưa có dữ liệu</div>
          ) : (
            tags.map((tag, i) => (
              <div key={tag.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs">
                    #{i + 1}
                  </div>
                  <span className="font-medium text-sm">{tag.name}</span>
                </div>
                <Badge variant="secondary">{tag.usageCount} bài</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { userProfileService } from "@/lib/api/userProfileService";

export function RecentUsers() {
  const [users, setUsers] = useState<(NewUserResponse & { avatarUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminService.getNewestUsers(0);
        const topUsers = response.content.slice(0, 5);

        const usersWithProfiles = await Promise.all(
          topUsers.map(async (user) => {
            try {
              const profile = await userProfileService.getUserProfile(user.id);
              return { ...user, avatarUrl: profile.avatarUrl };
            } catch (err) {
              return user;
            }
          })
        );

        setUsers(usersWithProfiles);
      } catch (error) {
        console.error("Failed to fetch recent users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle>Người dùng mới đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : users.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">Chưa có người dùng mới</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                    />
                    <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: vi })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

