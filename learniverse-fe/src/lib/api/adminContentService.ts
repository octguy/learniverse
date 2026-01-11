import apiService from "@/lib/apiService";
import { PageResponse, ApiResponse } from "@/types/api";
import { AdminContentFilter, AdminPostDto, AdminQuestionDto } from "@/types/adminContent";
import { Post } from "@/types/post";
import { QuestionDetail } from "@/types/question";

export const adminContentService = {
  getQuestions: async (filter: AdminContentFilter) => {
    const params = new URLSearchParams();
    if (filter.status) params.append("status", filter.status);
    if (filter.ownerId) params.append("ownerId", filter.ownerId);
    if (filter.keyword) params.append("keyword", filter.keyword);
    if (filter.page !== undefined) params.append("page", filter.page.toString());
    if (filter.size !== undefined) params.append("size", filter.size.toString());
    if (filter.sort) {
        filter.sort.forEach(s => params.append("sort", s));
    }

    const res = await apiService.get<ApiResponse<PageResponse<AdminQuestionDto>>>(
      `/dashboard/questions`,
      {
        params: params,
      }
    );
    return res.data?.data;
  },

  deleteQuestions: async (ids: string[]) => {
    const res = await apiService.delete(
      `/dashboard/questions`,
      {
        data: ids,
      }
    );
    return res.data;
  },

  getPosts: async (filter: AdminContentFilter) => {
    const params = new URLSearchParams();
    if (filter.status) params.append("status", filter.status);
    if (filter.ownerId) params.append("ownerId", filter.ownerId);
    if (filter.keyword) params.append("keyword", filter.keyword);
    if (filter.page !== undefined) params.append("page", filter.page.toString());
    if (filter.size !== undefined) params.append("size", filter.size.toString());
    if (filter.sort) {
        filter.sort.forEach(s => params.append("sort", s));
    }

    const res = await apiService.get<ApiResponse<PageResponse<AdminPostDto>>>(
      `/dashboard/posts`,
      {
        params: params,
      }
    );
    return res.data?.data;
  },

  getPost: async (id: string) => {
    // Use the public endpoint /posts/{id} as confirmed by documentation
    const res = await apiService.get<ApiResponse<Post>>(`/posts/${id}`);
    return res.data?.data;
  },

  getQuestion: async (id: string) => {
    const res = await apiService.get<ApiResponse<QuestionDetail>>(`/questions/${id}`);
    return res.data?.data;
  },

  deletePosts: async (ids: string[]) => {
    const res = await apiService.delete(
      `/dashboard/posts`,
      {
        data: ids,
      }
    );
    return res.data;
  },

  updateQuestionStatus: async (id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED") => {
    const res = await apiService.patch(
      `/dashboard/questions/${id}/status`,
      { status }
    );
    return res.data;
  },

  updatePostStatus: async (id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED") => {
    const res = await apiService.patch(
      `/dashboard/posts/${id}/status`,
      { status }
    );
    return res.data;
  },
};
