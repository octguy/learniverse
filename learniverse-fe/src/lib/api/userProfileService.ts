import apiService from "@/lib/apiService";
import { UserProfileResponse, UpdateProfileRequest } from "@/types/userProfile";
import { UserTag } from "@/types/userTag";
import { ApiResponse, PageResponse } from "@/types/api";

const BASE_URL = "/user_profile";

export const userProfileService = {
    getMyProfile: async () => {
        const res = await apiService.get<UserProfileResponse>(`${BASE_URL}/me`);
        return res.data;
    },

    getUserProfile: async (userId: string) => {
        const res = await apiService.get<UserProfileResponse>(`${BASE_URL}/${userId}`);
        return res.data;
    },

    getAllUserTags: async () => {
        const res = await apiService.get<ApiResponse<UserTag[]>>("/tags/all");
        return res.data.data;
    },

    updateMyProfile: async (data: UpdateProfileRequest) => {
        const formData = new FormData();

        const jsonBody = {
            displayName: data.displayName,
            bio: data.bio,
            interestTagIds: data.interestTagIds || [],
            skillTagIds: data.skillTagIds || []
        };

        formData.append("data", new Blob([JSON.stringify(jsonBody)], { type: "application/json" }));

        if (data.avatar instanceof File) {
            formData.append("avatar", data.avatar);
        }
        if (data.cover instanceof File) {
            formData.append("cover", data.cover);
        }

        const res = await apiService.put<UserProfileResponse>(`${BASE_URL}/me`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    onboardProfile: async (data: UpdateProfileRequest) => {
        const formData = new FormData();

        const jsonBody = {
            displayName: data.displayName,
            bio: data.bio,
            interestTagIds: data.interestTagIds || [],
            skillTagIds: data.skillTagIds || []
        };

        formData.append("data", new Blob([JSON.stringify(jsonBody)], { type: "application/json" }));

        if (data.avatar instanceof File) {
            formData.append("avatar", data.avatar);
        }
        if (data.cover instanceof File) {
            formData.append("cover", data.cover);
        }

        const res = await apiService.post<UserProfileResponse>(`${BASE_URL}/onboard`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    search: async (query: string, page = 0, size = 10) => {
        return apiService.get<ApiResponse<PageResponse<UserProfileResponse>>>(`${BASE_URL}/search`, {
            params: { search: query, page, size }
        });
    }
};