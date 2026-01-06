import apiService from "@/lib/apiService";
import { ApiResponse, PageResponse } from "@/types/api";
import { Notification } from "@/types/notification";

const BASE_URL = "/notifications";

export const notificationService = {
  getNotifications: async (page = 0, size = 10) => {
    const response = await apiService.get<ApiResponse<PageResponse<Notification>>>(BASE_URL, {
      params: {
        page,
        size,
        sort: "createdAt,desc"
      }
    });
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await apiService.get<ApiResponse<number>>(`${BASE_URL}/unread-count`);
    return response.data.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiService.put<ApiResponse<Notification>>(`${BASE_URL}/${id}/mark-read`);
    return response.data.data;
  },

  markAllAsRead: async () => {
    const response = await apiService.put<ApiResponse<void>>(`${BASE_URL}/mark-all-read`);
    return response.data.data;
  }
};
