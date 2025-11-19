import apiService from "@/lib/apiService";
import { ApiResponse } from "@/types/api";
import { CreatePostRequest, Tag } from "@/types/post";

export interface PostResponse {
    id: string;
    title: string;
    slug: string;
}

export const postService = {
    getAllTags: async () => {
        const response = await apiService.get<ApiResponse<Tag[]>>("/tags/all");
        return response.data;
    },

    createPost: async (data: CreatePostRequest) => {
        const response = await apiService.post<ApiResponse<PostResponse>>("/posts", data);
        return response.data;
    }
};