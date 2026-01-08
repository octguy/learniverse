import apiService from "@/lib/apiService";
import { User } from "@/types/user";
import { ApiResponse, PageResponse } from "@/types/api";

const BASE_URL = "/users";
const DASHBOARD_URL = "/dashboard/users";

export interface UserAdmin extends User {
    role: "ROLE_USER" | "ROLE_ADMIN";
    createdAt: string;
}

export const adminUserService = {
    getAllUsers: async (page = 0, size = 20, search = "") => {
        const params: any = { page, size };
        if (search) {
            params.search = search;
        }
        const response = await apiService.get<PageResponse<UserAdmin>>(`${DASHBOARD_URL}`, { params });
        return response.data;
    },

    updateUserStatus: async (userId: string, status: string) => {
        const response = await apiService.put<UserAdmin>(`${DASHBOARD_URL}/${userId}/status`, { status });
        return response.data;
    },

    updateUserRole: async (userId: string, role: string) => {
        const response = await apiService.put<UserAdmin>(`${DASHBOARD_URL}/${userId}/role`, { role });
        return response.data;
    },

    registerAdmin: async (payload: { email: string; username: string }) => {
        const dummyPayload = {
            ...payload,
            password: "TempPassword123@" 
        };
        const response = await apiService.post<any>(`/auth/register-admin`, dummyPayload);
        return response.data;
    }
};
