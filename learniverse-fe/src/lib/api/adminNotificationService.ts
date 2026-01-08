import apiService from "@/lib/apiService";
import { PageResponse } from "@/types/api";
import { Notification } from "@/types/notification";

const DASHBOARD_URL = "/dashboard/notifications";

export interface SendNotificationRequest {
    content: string;
    recipientIds?: string[];
    relatedEntityId?: string;
    relatedEntityType?: string;
    notificationType?: string; 
}

export interface BroadcastNotificationRequest {
    content: string;
    notificationType?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
}

export const adminNotificationService = {
    getAllNotifications: async (page = 0, size = 20) => {
        const params = { page, size };
        const response = await apiService.get<PageResponse<Notification>>(`${DASHBOARD_URL}`, { params });
        return response.data;
    },

    sendNotification: async (data: SendNotificationRequest) => {
        const response = await apiService.post(`${DASHBOARD_URL}`, data);
        return response.data;
    },

    broadcastNotification: async (data: BroadcastNotificationRequest) => {
        const response = await apiService.post(`${DASHBOARD_URL}/broadcast`, data);
        return response.data;
    }
};
