import apiService from "@/lib/apiService"
import type { ApiResponse, PageResponse } from "@/types/api"
import type {
    QuestionDetail,
    QuestionResponse,
    QuestionSummary,
} from "@/types/question"

export interface QuestionQuery {
    page?: number
    size?: number
    sort?: string
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
        const url = BASE_PATH;
        const searchParams: Record<string, any> = {
            page: params.page,
            size: params.size,
            sort: params.sort,
        };

        if (params.query) {
            searchParams.query = params.query;
            searchParams.keyword = params.query;
            searchParams.search = params.query;
            searchParams.title = params.query;
        }

        const response = await apiService.get<
            ApiResponse<PageResponse<QuestionSummary>>
        >(BASE_PATH, {
            params: {
                page: params.page,
                size: params.size,
                sort: params.sort,
            },
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
