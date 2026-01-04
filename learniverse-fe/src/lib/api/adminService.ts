import apiService from "@/lib/apiService";
import {
    DashboardStatsResponse,
    UserGrowthResponse,
    ContentComparisonResponse,
    TopTagResponse,
    NewUserResponse
} from "@/types/dashboard";
import { PageResponse } from "@/types/api";

const BASE_URL = "/dashboard";

export const adminService = {
    getStats: async () => {
        try {
            const res = await apiService.get<DashboardStatsResponse>(`${BASE_URL}/stats`);
            return res.data;
        } catch (error) {
            console.error("Error fetching stats:", error);
            return { totalUsers: 0, newUsersToday: 0, totalPosts: 0, totalQuestions: 0 };
        }
    },

    getUserGrowth: async (period: 'DAY' | 'MONTH' | 'YEAR' = 'DAY') => {
        try {
            const res = await apiService.get<UserGrowthResponse>(`${BASE_URL}/user-growth`, {
                params: { period }
            });
            return res.data;
        } catch (error) {
            console.error("Error fetching user growth:", error);
            return { period, data: [] };
        }
    },

    getContentComparison: async (period: 'DAY' | 'MONTH' | 'YEAR' = 'DAY') => {
        try {
            const res = await apiService.get<ContentComparisonResponse>(`${BASE_URL}/content-comparison`, {
                params: { period }
            });
            return res.data;
        } catch (error) {
            console.error("Error fetching content comparison:", error);
            return { period, data: [] };
        }
    },

    getTopTags: async () => {
        try {
            const res = await apiService.get<TopTagResponse[]>(`${BASE_URL}/top-tags`);
            return res.data;
        } catch (error) {
            console.error("Error fetching top tags:", error);
            return [];
        }
    },

    getNewestUsers: async (page: number = 0) => {
        try {
            const res = await apiService.get<PageResponse<NewUserResponse>>(`${BASE_URL}/newest-users`, {
                params: { page }
            });
            return res.data;
        } catch (error) {
            console.error("Error fetching newest users:", error);
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                currentPage: 0,
                pageSize: 20,
                last: true,
                first: true,
                numberOfElements: 0
            };
        }
    }
};
