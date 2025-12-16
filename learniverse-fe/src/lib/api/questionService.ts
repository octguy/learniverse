import apiService from "@/lib/apiService"
import type { ApiResponse, PageResponse } from "@/types/api"
import type {QuestionDetail, QuestionResponse, QuestionSummary} from "@/types/question"

export interface QuestionQuery {
    page?: number
    size?: number
    sort?: string
}

const BASE_PATH = "/questions"

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const questionService = {
    async list(params: QuestionQuery = {}) {
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
    async create(payload: { title: string; body: string; tagIds: string[] }) {
        const response = await apiService.post<ApiResponse<QuestionDetail>>(
            BASE_PATH,
            payload
        )
        return unwrap(response.data)
    },
    getQuestionsByUserId: async (userId: string, page = 0, size = 10) => {
        return apiService.get<PageResponse<QuestionResponse>>(`/questions/user/${userId}?page=${page}&size=${size}`);
    },
}
