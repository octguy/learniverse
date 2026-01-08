import apiService from "@/lib/apiService"
import type { ApiResponse, PageResponse } from "@/types/api"
import type {
    Group,
    GroupSummary,
    GroupMember,
    GroupJoinRequest,
    CreateGroupRequest,
    UpdateGroupRequest,
    GroupPrivacy,
} from "@/types/group"
import type { Post } from "@/types/post"

const BASE_PATH = "/groups"

function unwrap<T>(response: ApiResponse<T>) {
    return response.data
}

export const groupService = {
    // ================== CRUD ==================

    /**
     * Create a new group with optional avatar and cover images
     */
    async create(
        request: CreateGroupRequest, 
        avatar?: File | null, 
        cover?: File | null
    ): Promise<Group> {
        const formData = new FormData()
        
        // Append all request fields
        formData.append("name", request.name)
        if (request.description) formData.append("description", request.description)
        if (request.privacy) formData.append("privacy", request.privacy)
        if (request.tagIds && request.tagIds.length > 0) {
            request.tagIds.forEach(tagId => formData.append("tagIds", tagId))
        }
        
        // Append files if provided
        if (avatar) formData.append("avatar", avatar)
        if (cover) formData.append("cover", cover)
        
        const response = await apiService.post<ApiResponse<Group>>(
            BASE_PATH,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        )
        return unwrap(response.data)
    },

    /**
     * Get group by slug
     */
    async getBySlug(slug: string): Promise<Group> {
        const response = await apiService.get<ApiResponse<Group>>(
            `${BASE_PATH}/${slug}`
        )
        return unwrap(response.data)
    },

    /**
     * Update a group
     */
    async update(groupId: string, request: UpdateGroupRequest): Promise<Group> {
        const response = await apiService.put<ApiResponse<Group>>(
            `${BASE_PATH}/${groupId}`,
            request
        )
        return unwrap(response.data)
    },

    /**
     * Delete a group
     */
    async delete(groupId: string): Promise<void> {
        await apiService.delete(`${BASE_PATH}/${groupId}`)
    },

    // ================== Discovery ==================

    /**
     * Browse public groups
     */
    async getPublicGroups(params?: {
        query?: string
        privacy?: GroupPrivacy
        page?: number
        size?: number
        sort?: string
    }): Promise<PageResponse<GroupSummary>> {
        const response = await apiService.get<ApiResponse<PageResponse<GroupSummary>>>(
            BASE_PATH,
            { params }
        )
        return unwrap(response.data)
    },

    /**
     * Get my groups
     */
    async getMyGroups(params?: {
        page?: number
        size?: number
    }): Promise<PageResponse<GroupSummary>> {
        const response = await apiService.get<ApiResponse<PageResponse<GroupSummary>>>(
            `${BASE_PATH}/my`,
            { params }
        )
        return unwrap(response.data)
    },

    // ================== Membership ==================

    /**
     * Join a group
     */
    async join(groupId: string): Promise<GroupMember> {
        const response = await apiService.post<ApiResponse<GroupMember>>(
            `${BASE_PATH}/${groupId}/join`
        )
        return unwrap(response.data)
    },

    /**
     * Leave a group
     */
    async leave(groupId: string): Promise<void> {
        await apiService.delete(`${BASE_PATH}/${groupId}/leave`)
    },

    /**
     * Get group members
     */
    async getMembers(
        groupId: string,
        params?: { page?: number; size?: number }
    ): Promise<PageResponse<GroupMember>> {
        const response = await apiService.get<ApiResponse<PageResponse<GroupMember>>>(
            `${BASE_PATH}/${groupId}/members`,
            { params }
        )
        return unwrap(response.data)
    },

    // ================== Join Requests ==================

    /**
     * Get pending join requests
     */
    async getPendingRequests(
        groupId: string,
        params?: { page?: number; size?: number }
    ): Promise<PageResponse<GroupJoinRequest>> {
        const response = await apiService.get<ApiResponse<PageResponse<GroupJoinRequest>>>(
            `${BASE_PATH}/${groupId}/requests`,
            { params }
        )
        return unwrap(response.data)
    },

    /**
     * Approve join request
     */
    async approveRequest(groupId: string, requestId: string): Promise<void> {
        await apiService.post(`${BASE_PATH}/${groupId}/requests/${requestId}/approve`)
    },

    /**
     * Reject join request
     */
    async rejectRequest(groupId: string, requestId: string): Promise<void> {
        await apiService.post(`${BASE_PATH}/${groupId}/requests/${requestId}/reject`)
    },

    // ================== Group Feed ==================

    /**
     * Get group feed
     */
    async getFeed(
        groupId: string,
        params?: { page?: number; size?: number }
    ): Promise<PageResponse<Post>> {
        const response = await apiService.get<ApiResponse<PageResponse<Post>>>(
            `${BASE_PATH}/${groupId}/feed`,
            { params }
        )
        return unwrap(response.data)
    },

    // ================== Moderation ==================

    /**
     * Kick a member
     */
    async kickMember(groupId: string, userId: string): Promise<void> {
        await apiService.post(`${BASE_PATH}/${groupId}/members/${userId}/kick`)
    },

    /**
     * Assign moderator role
     */
    async assignModerator(groupId: string, userId: string): Promise<void> {
        await apiService.post(`${BASE_PATH}/${groupId}/members/${userId}/moderator`)
    },

    /**
     * Remove moderator role
     */
    async removeModerator(groupId: string, userId: string): Promise<void> {
        await apiService.delete(`${BASE_PATH}/${groupId}/members/${userId}/moderator`)
    },

    /**
     * Transfer ownership
     */
    async transferOwnership(groupId: string, newOwnerId: string): Promise<void> {
        await apiService.post(`${BASE_PATH}/${groupId}/transfer-ownership/${newOwnerId}`)
    },

    /**
     * Pin a post
     */
    async pinPost(groupId: string, postId: string): Promise<void> {
        await apiService.post(`${BASE_PATH}/${groupId}/posts/${postId}/pin`)
    },

    /**
     * Unpin a post
     */
    async unpinPost(groupId: string, postId: string): Promise<void> {
        await apiService.delete(`${BASE_PATH}/${groupId}/posts/${postId}/pin`)
    },
}
