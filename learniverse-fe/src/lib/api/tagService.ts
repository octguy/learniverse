import apiService from "@/lib/apiService";
import { ApiResponse, PageResponse } from "@/types/api";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
}

const BASE_URL = "/tags";
const DASHBOARD_URL = "/dashboard/tags";

export const tagService = {
  getAllTags: async (page = 0, size = 10, query = "", sort = "name,asc") => {
    const params: any = { page, size, sort };
    if (query) {
      params.query = query;
    }
    const response = await apiService.get<ApiResponse<PageResponse<Tag>>>(BASE_URL, {
      params
    });
    return response.data.data;
  },

  getPopularTags: async () => {
    const response = await apiService.get<ApiResponse<PageResponse<Tag>>>(BASE_URL, {
      params: { page: 0, size: 20 }
    });
    return response.data.data.content;
  },

  getAllTagsAll: async () => {
    const response = await apiService.get<ApiResponse<Tag[]>>(`${BASE_URL}/all`);
    return response.data.data;
  },

  createTag: async (data: CreateTagRequest) => {
    const response = await apiService.post<ApiResponse<Tag>>(BASE_URL, data);
    return response.data.data;
  },

  updateTag: async (id: string, data: UpdateTagRequest) => {
    const response = await apiService.put<ApiResponse<Tag>>(`${DASHBOARD_URL}/${id}`, data);
    return response.data.data;
  },

  deleteTag: async (id: string) => {
    const response = await apiService.delete<ApiResponse<void>>(`${DASHBOARD_URL}/${id}`);
    return response.data;
  }
};