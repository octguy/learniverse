import apiService from "@/lib/apiService";
import { ApiResponse, PageResponse } from "@/types/api";
import { Comment } from "@/types/comment";

const BASE_URL = "/comments";

export const commentService = {
  getComments: async (type: "CONTENT" | "ANSWER", id: string, page = 0, size = 10) => {
    const response = await apiService.get<ApiResponse<PageResponse<Comment>>>(BASE_URL, {
      params: {
        type,
        id,
        page,
        size,
        sort: "createdAt,desc" 
      }
    });
    return response.data.data;
  },

  createComment: async (payload: {
    commentableType: "CONTENT" | "ANSWER";
    commentableId: string;
    body: string;
    parentId?: string; 
  }) => {
    const response = await apiService.post<ApiResponse<Comment>>(BASE_URL, payload);
    return response.data.data;
  }
};