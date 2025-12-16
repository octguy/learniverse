import apiService from "@/lib/apiService";
import { ApiResponse, PageResponse } from "@/types/api";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number; 
}

const BASE_URL = "/tags";

export const tagService = {
  getAllTags: async (page = 0, size = 10) => {
    const response = await apiService.get<ApiResponse<PageResponse<Tag>>>(BASE_URL, {
      params: { page, size, sort: "name,asc" }
    });
    return response.data.data;
  },
  getPopularTags: async () => {
    const response = await apiService.get<ApiResponse<PageResponse<Tag>>>(BASE_URL, {
      params: { page: 0, size: 20 }
    });
    return response.data.data.content;
  }
};