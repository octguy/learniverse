import apiService from "@/lib/apiService";
import { UserProfileResponse, UpdateProfileRequest } from "@/types/userProfile";
import { UserTag } from "@/types/userTag";

const BASE_URL = "/user_profile";

export const userProfileService = {
    getMyProfile: async () => {
        const res = await apiService.get<UserProfileResponse>(`${BASE_URL}/me`);
        return res.data;
    },

    getAllUserTags: async () => {
        const res = await apiService.get<UserTag[]>("/user-tags/all");
        return res.data;
    },

    updateMyProfile: async (data: UpdateProfileRequest) => {
        const formData = new FormData();
        if (data.displayName) formData.append("displayName", data.displayName);
        if (data.bio) formData.append("bio", data.bio);
        if (data.avatar) formData.append("avatar", data.avatar);
        if (data.coverImage) formData.append("coverImage", data.coverImage);

        if (data.userTags && data.userTags.length > 0) {
            data.userTags.forEach((tagId) => {
                formData.append("userTags", tagId);
            });
        }

        const res = await apiService.put<UserProfileResponse>(`${BASE_URL}/me`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    },

    onboardProfile: async (data: UpdateProfileRequest) => {
        const formData = new FormData();
        if (data.displayName) formData.append("displayName", data.displayName);
        if (data.bio) formData.append("bio", data.bio);
        if (data.avatar) formData.append("avatar", data.avatar);

        if (data.userTags && data.userTags.length > 0) {
            data.userTags.forEach((tagId) => {
                formData.append("userTags", tagId);
            });
        }

        const res = await apiService.post<UserProfileResponse>(`${BASE_URL}/onboard`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    }
};