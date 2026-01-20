import apiService from "@/lib/apiService"
import type { ApiResponse, PageResponse } from "@/types/api"
import type {
    QuestionDetail,
    QuestionResponse,
    QuestionSummary,
} from "@/types/question"

export interface QuestionQuery {
    query?: string
    page?: number
    size?: number
    sort?: string
    answerFilter?: string
    tagIds?: string[]
}

export interface CreateQuestionPayload {
    title: string
    body: string
    tagIds: string[]
    status?: "DRAFT" | "PUBLISHED"
}

export interface UpdateQuestionPayload {
    title: string
    body: string
    tagIds: string[]
    editReason?: string
    removeMediaIds?: string[]
}

const BASE_PATH = "/questions"

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const questionService = {
    async list(params: QuestionQuery = {}) {
        // Build query parameters object
        const queryParams: Record<string, string | number | undefined> = {
            page: params.page,
            size: params.size,
            sort: params.sort,
        };

        // Add search query if provided
        if (params.query) {
            queryParams.query = params.query;
        }

        // Add answer filter if provided (unanswered, answered, accepted)
        if (params.answerFilter) {
            queryParams.answerFilter = params.answerFilter;
        }

        // Add tag IDs if provided (backend expects List<UUID> as comma-separated or repeated params)
        // For Spring, we can pass tagIds as repeated query params
        const finalParams: Record<string, any> = { ...queryParams };
        if (params.tagIds && params.tagIds.length > 0) {
            finalParams.tagIds = params.tagIds;
        }

        const response = await apiService.get<
            ApiResponse<PageResponse<QuestionSummary>>
        >(BASE_PATH, {
            params: finalParams,
        })
        return unwrap(response.data)
    },
    async getById(id: string) {
        const response = await apiService.get<ApiResponse<QuestionDetail>>(
            `${BASE_PATH}/${id}`
        )
        return unwrap(response.data)
    },
    async getBySlug(slug: string) {
        const response = await apiService.get<ApiResponse<QuestionDetail>>(
            `${BASE_PATH}/slug/${slug}`
        )
        return unwrap(response.data)
    },
    /**
     * Create a new question using multipart/form-data
     * Backend expects: @RequestPart("question") + @RequestPart("files") optional
     */
    async create(payload: CreateQuestionPayload, files?: File[]) {
        const formData = new FormData()
        
        // Append the question JSON as a Blob with application/json type
        const questionBlob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
        })
        formData.append("question", questionBlob)
        
        // Append files if provided
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append("files", file)
            })
        }
        
        const response = await apiService.post<ApiResponse<QuestionDetail>>(
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
     * Update an existing question
     * Backend expects: @RequestBody UpdateQuestionRequest (JSON)
     */
    async update(id: string, payload: UpdateQuestionPayload) {
        const response = await apiService.put<ApiResponse<QuestionDetail>>(
            `${BASE_PATH}/${id}`,
            payload
        )
        return unwrap(response.data)
    },
    async remove(id: string) {
        const response = await apiService.delete<ApiResponse<void>>(
            `${BASE_PATH}/${id}`
        )
        return unwrap(response.data)
    },
    async acceptAnswer(questionId: string, answerId: string) {
        const response = await apiService.put<ApiResponse<void>>(
            `${BASE_PATH}/${questionId}/answers/${answerId}/accept`
        )
        return unwrap(response.data)
    },
    async unacceptAnswer(questionId: string, answerId: string) {
        const response = await apiService.delete<ApiResponse<void>>(
            `${BASE_PATH}/${questionId}/answers/${answerId}/accept`
        )
        return unwrap(response.data)
    },
    getQuestionsByUserId: async (userId: string, page = 0, size = 10) => {
        const response = await apiService.get<ApiResponse<PageResponse<QuestionResponse>>>(
            `/questions/author/${userId}`,
            {
                params: {
                    page,
                    size,
                    sort: "publishedAt,desc",
                },
            }
        )
                return unwrap(response.data)
    },
    /**
     * Get questions by author
     * Backend endpoint: GET /questions/author/{authorId}
     */
    async getQuestionsByAuthor(authorId: string, page = 0, size = 10) {
        const response = await apiService.get<
            ApiResponse<PageResponse<QuestionSummary>>
        >(`${BASE_PATH}/author/${authorId}`, {
            params: { page, size },
        })
        return unwrap(response.data)
    },
    /**
     * Add attachments to an existing question
     * Backend endpoint: POST /questions/{questionId}/attachments (multipart)
     */
    async addAttachments(questionId: string, files: File[]) {
        const formData = new FormData()
        files.forEach((file) => {
            formData.append("files", file)
        })
        
        const response = await apiService.post<ApiResponse<QuestionDetail>>(
            `${BASE_PATH}/${questionId}/attachments`,
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
     * Remove an attachment from a question
     * Backend endpoint: DELETE /questions/{questionId}/attachments/{attachmentId}
     */
    async removeAttachment(questionId: string, attachmentId: string) {
        const response = await apiService.delete<ApiResponse<void>>(
            `${BASE_PATH}/${questionId}/attachments/${attachmentId}`
        )
        return unwrap(response.data)
    },
}
