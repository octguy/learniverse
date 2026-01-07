import apiService from "@/lib/apiService";
import { ApiResponse } from "@/types/api";
import { Post } from "@/types/post";

export type ShareType = "NEWSFEED" | "GROUP" | "DIRECT_MESSAGE";

export interface ShareToFeedRequest {
    originalContentId: string;
    caption?: string;
    shareType: "NEWSFEED";
}

export interface TrackShareRequest {
    originalContentId: string;
    caption?: string;
    shareType: "DIRECT_MESSAGE" | "GROUP";
}

export const shareService = {
    shareToFeed: async (request: ShareToFeedRequest) => {
        const response = await apiService.post<ApiResponse<Post>>("/shares/feed", request);
        return response.data;
    },

    trackShare: async (request: TrackShareRequest) => {
        const response = await apiService.post<ApiResponse<null>>("/shares/track", request);
        return response.data;
    }
};
