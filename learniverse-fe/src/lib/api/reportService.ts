import apiService from '@/lib/apiService';
import { ApiResponse, PageResponse } from '@/types/api';
import { CreateReportRequest, ReportDTO, ResolveReportRequest } from '@/types/report';

const BASE_URL = '/reports';

export const reportService = {
    getReports: async (params: {
        status?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        size?: number;
        sort?: string[];
    }) => {
        const response = await apiService.get<ApiResponse<PageResponse<ReportDTO>>>(BASE_URL, { params });
        return response.data;
    },

    getReportDetail: async (reportId: string) => {
        const response = await apiService.get<ApiResponse<ReportDTO>>(`${BASE_URL}/${reportId}`);
        return response.data;
    },

    resolveReport: async (reportId: string, data: ResolveReportRequest) => {
        const response = await apiService.put<ApiResponse<ReportDTO>>(`${BASE_URL}/${reportId}`, data);
        return response.data;
    },

    createReport: async (data: CreateReportRequest) => {
        const response = await apiService.post<ApiResponse<ReportDTO>>(BASE_URL, data);
        return response.data;
    },

    getMyReports: async (params: {
        page?: number;
        size?: number;
        sort?: string[];
    }) => {
        const response = await apiService.get<ApiResponse<PageResponse<ReportDTO>>>(`${BASE_URL}/my-reports`, { params });
        return response.data;
    },

    getMyReportDetail: async (reportId: string) => {
        const response = await apiService.get<ApiResponse<ReportDTO>>(`${BASE_URL}/my-reports/${reportId}`);
        return response.data;
    },

    getPendingCount: async () => {
        const response = await apiService.get<ApiResponse<number>>(`${BASE_URL}/count/pending`);
        return response.data;
    },

    checkReportExisting: async (type: string, id: string) => {
        const response = await apiService.get<ApiResponse<boolean>>(`${BASE_URL}/check`, {
            params: {
                type,
                id
            }
        });
        return response.data;
    }
};
