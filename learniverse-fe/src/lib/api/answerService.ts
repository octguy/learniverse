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
     * Create a new answer (with optional file attachments)
     * Backend expects: multipart/form-data with @RequestPart("answer") + @RequestPart("files")
     */
    async create(payload: CreateAnswerPayload, files?: File[]) {
        const formData = new FormData()

        // Append the answer JSON as a Blob with application/json type
        const answerBlob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
        })
        formData.append("answer", answerBlob)

        // Append files if provided
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append("files", file)
            })
        }

        const response = await apiService.post<ApiResponse<QuestionAnswer>>(
            BASE_PATH,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
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
}
