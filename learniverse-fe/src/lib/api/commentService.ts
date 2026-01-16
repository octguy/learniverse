import apiService from "@/lib/apiService";
import { ApiResponse, PageResponse } from "@/types/api";
import { Comment } from "@/types/comment";

const BASE_URL = "/comments";

export const commentService = {
  getComments: async (type: "POST" | "QUESTION" | "ANSWER" | "SHARED_POST", id: string, page = 0, size = 10) => {
    const backendType = (type === "POST" || type === "QUESTION" || type === "SHARED_POST") ? "CONTENT" : type;
    const response = await apiService.get<ApiResponse<PageResponse<Comment>>>(BASE_URL, {
      params: {
        type: backendType,
        id,
        page,
        size,
        sort: "createdAt,desc"
      }
    });
    return response.data.data;
  },

  getReplies: async (commentId: string, page = 0, size = 10) => {
    const response = await apiService.get<ApiResponse<PageResponse<Comment>>>(`${BASE_URL}/${commentId}/replies`, {
      params: {
        page,
        size,
        sort: "createdAt,asc"
      }
    });
    return response.data.data;
  },

  getCommentById: async (commentId: string) => {
    const response = await apiService.get<ApiResponse<Comment>>(`${BASE_URL}/${commentId}`);
    return response.data.data;
  },

  createComment: async (payload: {
    commentableType: "POST" | "QUESTION" | "ANSWER" | "SHARED_POST";
    commentableId: string;
    body: string;
    parentId?: string;
    mentionedUserIds?: string[];
  }) => {
    const backendPayload = {
      ...payload,
      commentableType: (payload.commentableType === "POST" || payload.commentableType === "QUESTION" || payload.commentableType === "SHARED_POST")
        ? "CONTENT"
        : payload.commentableType
    };
    const response = await apiService.post<ApiResponse<Comment>>(BASE_URL, backendPayload);
    return response.data.data;
  },

  updateComment: async (id: string, body: string, mentionedUserIds?: string[]) => {
    const response = await apiService.put<ApiResponse<Comment>>(`${BASE_URL}/${id}`, {
      body,
      mentionedUserIds
    });
    return response.data.data;
  }
};