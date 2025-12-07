import apiService from "@/lib/apiService"
import type { ApiResponse } from "@/types/api"

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
}
