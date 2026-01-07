import apiService from "@/lib/apiService";
import { Friend, FriendStatus, SuggestedFriend } from "@/types/friend";
import { ApiResponse, PageResponse } from "@/types/api";

const BASE_URL = "/friends";

export const friendService = {
    sendRequest: async (receiverId: string) => {
        return apiService.post<ApiResponse<void>>(`${BASE_URL}/request/${receiverId}`);
    },

    acceptRequest: async (senderId: string) => {
        return apiService.post<ApiResponse<void>>(`${BASE_URL}/accept/${senderId}`);
    },

    rejectRequest: async (senderId: string) => {
        return apiService.delete<ApiResponse<void>>(`${BASE_URL}/decline/${senderId}`);
    },

    cancelRequest: async (receiverId: string) => {
        return apiService.delete<ApiResponse<void>>(`${BASE_URL}/cancel/${receiverId}`);
    },

    unfriend: async (friendId: string) => {
        return apiService.delete<ApiResponse<void>>(`${BASE_URL}/${friendId}`);
    },

    getFriends: async () => {
        return apiService.get<ApiResponse<SuggestedFriend[]>>(`${BASE_URL}`);
    },
    getFriendRequests: async () => {
        return apiService.get<ApiResponse<SuggestedFriend[]>>(
            `${BASE_URL}/requests/received`
        );
    },

    getFriendStatus: async (targetUserId: string) => {
        return apiService.get<ApiResponse<FriendStatus>>(`${BASE_URL}/status/${targetUserId}`);
    },

    getSuggestedFriends: async (limit = 10) => {
        return apiService.get<ApiResponse<SuggestedFriend[]>>(`${BASE_URL}/suggestions?limit=${limit}`);
    },

    searchFriends: async (keyword: string) => {
        return apiService.get<ApiResponse<SuggestedFriend[]>>(`${BASE_URL}/search`, {
            params: { keyword }
        });
    },
};