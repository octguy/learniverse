import apiService from "@/lib/apiService";
import { ApiResponse } from "@/types/api";
import { CreatePostRequest, Tag, Post, UpdatePostRequest } from "@/types/post";

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

    createPost: async (data: CreatePostRequest, files: File[]) => {
        const formData = new FormData();
        const jsonBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
        formData.append("post", jsonBlob);
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append("files", file);
            });
        }
        const response = await apiService.post<ApiResponse<PostResponse>>("/posts", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    updatePost: async (id: string, data: UpdatePostRequest, files: File[]) => {
        const formData = new FormData();
        const jsonBlob = new Blob([JSON.stringify(data)], { type: "application/json" });
        formData.append("post", jsonBlob);
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append("files", file);
            });
        }
        const response = await apiService.put<ApiResponse<PostResponse>>(`/posts/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
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
    deletePost: async (id: string) => {
        const response = await apiService.delete<ApiResponse<void>>(`/posts/${id}`);
        return response.data;
    },
};