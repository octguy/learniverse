import apiService from "@/lib/apiService"
import type {ApiResponse, PageResponse} from "@/types/api"
import {BookmarkResponse} from "@/types/post";

export type VoteType = "UPVOTE" | "DOWNVOTE"
export type VotableType = "CONTENT" | "ANSWER"

export type ReactionType = "LIKE" | "LOVE" | "INSIGHTFUL" | "HELPFUL" | "CURIOUS"
export type ReactableType = "CONTENT" | "ANSWER" | "COMMENT"
const BASE_PATH = "/interactions"

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const interactionService = {
    async vote(payload: {
        votableType: VotableType
        votableId: string
        voteType: VoteType
    }) {
        const response = await apiService.post<ApiResponse<number>>(
            `${BASE_PATH}/vote`,
            payload
        )
        return unwrap(response.data)
    },
    async react(payload: {
        reactableType: ReactableType
        reactableId: string
        reactionType: ReactionType
    }) {
        const response = await apiService.post<ApiResponse<void>>(
            `${BASE_PATH}/react`,
            payload
        )
        return unwrap(response.data)
    },
    async bookmark(contentId: string) {
        const response = await apiService.post<ApiResponse<any>>(`${BASE_PATH}/bookmark`, {
            contentId: contentId,
        })
        return unwrap(response.data)
    },
    async unbookmark(contentId: string) {
        const response = await apiService.delete<ApiResponse<void>>(`${BASE_PATH}/bookmark/${contentId}`)
        return unwrap(response.data)
    },
    getMyBookmarks: async (page = 0, size = 10) => {
        const res = await apiService.get<ApiResponse<PageResponse<BookmarkResponse>>>(
            `${BASE_PATH}/bookmarks/me`,
            { params: { page, size } }
        );
        return res.data.data;
    },
}
