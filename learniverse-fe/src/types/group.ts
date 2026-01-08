// Group privacy types
export type GroupPrivacy = "PUBLIC" | "PRIVATE"

// Group member roles
export type GroupMemberRole = "OWNER" | "MODERATOR" | "MEMBER"

// Join request status
export type GroupJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

// Group summary for list views
export interface GroupSummary {
    id: string
    name: string
    slug: string
    description: string | null
    avatarUrl: string | null
    privacy: GroupPrivacy
    memberCount: number
    tags: Array<{
        id: string
        name: string
        slug: string
    }>
    isMember: boolean
    hasPendingRequest: boolean
}

// Full group details
export interface Group extends GroupSummary {
    coverImageUrl: string | null
    createdBy: {
        id: string
        username: string
        displayName: string
        avatarUrl: string | null
    }
    createdAt: string
    updatedAt: string
    currentUserRole: GroupMemberRole | null
}

// Group member
export interface GroupMember {
    id: string
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    role: GroupMemberRole
    joinedAt: string
    isBanned: boolean
}

// Join request
export interface GroupJoinRequest {
    id: string
    groupId: string
    groupName: string
    user: {
        id: string
        username: string
        displayName: string
        avatarUrl: string | null
    }
    status: GroupJoinRequestStatus
    message: string | null
    createdAt: string
    processedAt: string | null
    processedBy: {
        id: string
        username: string
        displayName: string
    } | null
}

// Create group request
export interface CreateGroupRequest {
    name: string
    description?: string
    avatarUrl?: string
    coverImageUrl?: string
    privacy?: GroupPrivacy
    tagIds?: string[]
}

// Update group request
export interface UpdateGroupRequest {
    name?: string
    description?: string
    avatarUrl?: string
    coverImageUrl?: string
    privacy?: GroupPrivacy
    tagIds?: string[]
}
