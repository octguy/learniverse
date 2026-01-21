import apiService from "@/lib/apiService"
import type { ApiResponse } from "@/types/api"
import type { QuestionAnswer } from "@/types/question"

const BASE_PATH = "/answers"

type CreateAnswerPayload = {
    questionId: string
    body: string
}

type UpdateAnswerPayload = {
    body: string
}

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const answerService = {
    /**
     * Create a new answer for a question
     * Backend accepts: JSON body with questionId and body
     */
    async create(payload: CreateAnswerPayload) {
        const response = await apiService.post<ApiResponse<QuestionAnswer>>(
            BASE_PATH,
            payload
        )
        return unwrap(response.data)
    },

    /**
     * Update an existing answer
     * Only allowed within 1 hour of creation per UC 3.8
     */
    async update(answerId: string, payload: UpdateAnswerPayload) {
        const response = await apiService.put<ApiResponse<QuestionAnswer>>(
            `${BASE_PATH}/${answerId}`,
            payload
        )
        return unwrap(response.data)
    },

    /**
     * Delete an answer (soft delete)
     * UC 3.10: Requires user to be the author or admin/mod
     */
    async remove(answerId: string) {
        const response = await apiService.delete<ApiResponse<void>>(
            `${BASE_PATH}/${answerId}`
        )
        return unwrap(response.data)
    },

    /**
     * Get answer by ID
     */
    async getById(answerId: string) {
        const response = await apiService.get<ApiResponse<QuestionAnswer>>(
            `${BASE_PATH}/${answerId}`
        )
        return unwrap(response.data)
    },

    /**
     * Get paginated answers for a question (used for infinite scroll)
     */
    async getForQuestion(questionId: string, page: number = 0, size: number = 10) {
        const response = await apiService.get<ApiResponse<{
            content: QuestionAnswer[]
            totalElements: number
            totalPages: number
            number: number
            last: boolean
        }>>(
            `${BASE_PATH}/question/${questionId}?page=${page}&size=${size}`
        )
        return unwrap(response.data)
    },
}
