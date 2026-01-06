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
    query?: string
}

const BASE_PATH = "/questions"

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const questionService = {
    async list(params: QuestionQuery = {}) {
        const url = BASE_PATH;
        const searchParams: any = {
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
        >(url, {
            params: searchParams,
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
    async update(
        id: string,
        payload: { title: string; body: string; tagIds: string[] }
    ) {
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
        return apiService.get<PageResponse<QuestionResponse>>(
            `/questions/user/${userId}?page=${page}&size=${size}`
        )
    },
}
