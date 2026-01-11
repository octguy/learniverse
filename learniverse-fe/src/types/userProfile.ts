import { UserTag } from "./userTag";

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    fullName?: string;
    displayName?: string;
    bio?: string;
}

export interface UserProfileResponse {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    coverUrl: string;
    reputation: number;
    postCount: number;
    answeredQuestionCount: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        email: string;
        status: string;
        isOnboarded: boolean;
    };
    interestTags: UserTag[];
    skillTags: UserTag[];
    role?: string;
    roles?: string[];
}

export interface UpdateProfileRequest {
    displayName?: string;
    bio?: string;
    avatar?: File | null;
    cover?: File | null;
    interestTagIds?: string[];
    skillTagIds?: string[];
}