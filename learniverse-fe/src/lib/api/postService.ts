import apiService from "@/lib/apiService";
import { ApiResponse } from "@/types/api";
import { CreatePostRequest, Tag, Post } from "@/types/post";

export interface PostResponse {
    id: string;
    title: string;
    slug: string;
}
interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    last: boolean;
}
export const postService = {
    getAllTags: async () => {
        const response = await apiService.get<ApiResponse<Tag[]>>("/tags/all");
        return response.data;
    },

    createPost: async (data: CreatePostRequest) => {
        const response = await apiService.post<ApiResponse<PostResponse>>("/posts", data);
        return response.data;
    },
    getNewsfeed: async (page = 0, size = 10) => {
        const response = await apiService.get<ApiResponse<PageResponse<Post>>>("/posts/feed", {
            params: { page, size }
        });
        return response.data;
    },
    getPostById: async (id: string) => {
    const response = await apiService.get<ApiResponse<Post>>(`/posts/${id}`);
    return response.data;
  },
    getPostsByUser: async (userId: string, page = 0, size = 10) => {
        const response = await apiService.get<ApiResponse<PageResponse<Post>>>(`/posts/author/${userId}`, {
            params: { page, size }
        });
        return response.data.data;
    },
};