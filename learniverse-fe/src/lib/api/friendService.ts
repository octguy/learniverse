import apiService from "@/lib/apiService";
import { Friend, FriendStatus } from "@/types/friend";
import { ApiResponse, PageResponse } from "@/types/api";

const BASE_URL = "/friends";

export const friendService = {
    sendRequest: async (receiverId: string) => {
        return apiService.post<ApiResponse<void>>(`${BASE_URL}/request/${receiverId}`);
    },

    acceptRequest: async (senderId: string) => {
        return apiService.put<ApiResponse<void>>(`${BASE_URL}/accept/${senderId}`);
    },

    rejectRequest: async (senderId: string) => {
        return apiService.delete<ApiResponse<void>>(`${BASE_URL}/reject/${senderId}`);
    },

    cancelRequest: async (receiverId: string) => {
        return apiService.delete<ApiResponse<void>>(`${BASE_URL}/cancel/${receiverId}`);
    },

    unfriend: async (friendId: string) => {
        return apiService.delete<ApiResponse<void>>(`${BASE_URL}/unfriend/${friendId}`);
    },

    getFriends: async (page = 0, size = 10) => {
        return apiService.get<ApiResponse<PageResponse<Friend>>>(
            `${BASE_URL}?page=${page}&size=${size}`
        );
    },
    getFriendRequests: async (page = 0, size = 10) => {
        return apiService.get<ApiResponse<PageResponse<Friend>>>(
            `${BASE_URL}/requests?page=${page}&size=${size}`
        );
    },

    getFriendStatus: async (targetUserId: string) => {
        return apiService.get<ApiResponse<FriendStatus>>(`${BASE_URL}/status/${targetUserId}`);
    },
};