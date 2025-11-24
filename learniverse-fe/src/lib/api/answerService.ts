import apiService from "@/lib/apiService"
import type { ApiResponse } from "@/types/api"
import type { QuestionAnswer } from "@/types/question"

const BASE_PATH = "/answers"

type CreateAnswerPayload = {
    questionId: string
    body: string
}

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const answerService = {
    async create(payload: CreateAnswerPayload) {
        const response = await apiService.post<ApiResponse<QuestionAnswer>>(
            BASE_PATH,
            payload
        )
        return unwrap(response.data)
    },
}
